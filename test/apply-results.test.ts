import { describe, expect, it } from 'vitest'
import { applyResults } from '../monitor/apply-results.ts'
import { MILLISECONDS_PER_DAY } from '../shared/constants.ts'
import { createConfig, createResult, createTarget } from './fixtures.ts'

const NOW = Date.parse('2026-10-04T12:00:00Z')
const FIVE_MINUTES = 5 * 60_000

describe('applyResults', () => {
  it('starts each target with today in its history', () => {
    const statusDocument = applyResults(
      undefined,
      createConfig(),
      [
        createResult('website'),
        createResult('api', { latencyMilliseconds: 80 }),
      ],
      NOW,
      'GitHub Actions',
    )

    expect(statusDocument.updatedAt).toBe(NOW)
    expect(statusDocument.intervalMinutes).toBe(5)
    expect(statusDocument.checkedFrom).toBe('GitHub Actions')
    expect(statusDocument.targets.api).toMatchObject({
      label: 'Api',
      status: 'operational',
      lastLatencyMilliseconds: 80,
      days: {
        '2026-10-04': {
          checks: 1,
          failures: 0,
          latencyTotalMilliseconds: 80,
          latencyMaxMilliseconds: 80,
        },
      },
    })
    expect(JSON.stringify(statusDocument)).not.toContain('example.test')
  })

  it('adds checks to the same day, and marks slow answers degraded', () => {
    const config = createConfig()
    const first = applyResults(
      undefined,
      config,
      [createResult('website')],
      NOW,
      '',
    )
    const second = applyResults(
      first,
      config,
      [createResult('website', { slow: true, latencyMilliseconds: 4000 })],
      NOW + FIVE_MINUTES,
      '',
    )

    expect(second.targets.website?.status).toBe('degraded')
    expect(second.targets.website?.days['2026-10-04']).toEqual({
      checks: 2,
      failures: 0,
      latencyTotalMilliseconds: 4120,
      latencyMaxMilliseconds: 4000,
    })
  })

  it('opens an incident when a target goes down, and closes it when it comes back', () => {
    const config = createConfig()
    const down = createResult('api', {
      up: false,
      statusCode: 503,
      error: 'HTTP 503',
    })
    const first = applyResults(undefined, config, [down], NOW, '')
    const second = applyResults(first, config, [down], NOW + FIVE_MINUTES, '')
    const third = applyResults(
      second,
      config,
      [createResult('api')],
      NOW + 2 * FIVE_MINUTES,
      '',
    )

    expect(first.targets.api?.status).toBe('down')
    expect(second.targets.api?.consecutiveFailures).toBe(2)
    expect(second.incidents).toHaveLength(1)
    expect(second.incidents[0]).toMatchObject({
      targetId: 'api',
      targetLabel: 'Api',
      startedAt: NOW,
      endedAt: 0,
      statusCode: 503,
      error: 'HTTP 503',
    })
    expect(third.targets.api?.status).toBe('operational')
    expect(third.targets.api?.consecutiveFailures).toBe(0)
    expect(third.incidents[0]?.endedAt).toBe(NOW + 2 * FIVE_MINUTES)
  })

  it('drops removed targets, closes their incidents and picks up new labels', () => {
    const config = createConfig()
    const down = createResult('api', { up: false, error: 'HTTP 500' })
    const first = applyResults(
      undefined,
      config,
      [createResult('website'), down],
      NOW,
      '',
    )
    const changed = {
      ...config,
      targets: [createTarget('website', { label: 'Home page', group: 'Web' })],
    }
    const second = applyResults(
      first,
      changed,
      [createResult('website')],
      NOW + FIVE_MINUTES,
      '',
    )

    expect(Object.keys(second.targets)).toEqual(['website'])
    expect(second.targets.website?.label).toBe('Home page')
    expect(second.targets.website?.group).toBe('Web')
    expect(second.incidents[0]?.endedAt).toBe(NOW + FIVE_MINUTES)
  })

  it('keeps 90 days of history and drops older days and incidents', () => {
    const config = createConfig()
    const old = applyResults(
      undefined,
      config,
      [createResult('website', { up: false })],
      NOW - 100 * MILLISECONDS_PER_DAY,
      '',
    )
    const recovered = applyResults(
      old,
      config,
      [createResult('website')],
      NOW - 99 * MILLISECONDS_PER_DAY,
      '',
    )
    const later = applyResults(
      recovered,
      config,
      [createResult('website')],
      NOW,
      '',
    )

    expect(Object.keys(later.targets.website?.days ?? {})).toEqual([
      '2026-10-04',
    ])
    expect(later.incidents).toEqual([])
  })
})
