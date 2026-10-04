import { describe, expect, it, vi } from 'vitest'
import { checkTarget } from '../monitor/check-target.ts'
import { describeResult } from '../monitor/describe-result.ts'
import { createTarget } from './fixtures.ts'

/**
 * Makes a fake fetch that answers each call with the next response in turn.
 *
 * @param {...(Response | Error)} answers What each call returns or throws.
 * @returns {ReturnType<typeof vi.fn<typeof fetch>>} The fake.
 */
function fakeFetch(...answers: (Response | Error)[]) {
  const queue = [...answers]

  return vi.fn<typeof fetch>(() => {
    const answer = queue.shift() ?? new Error('No more answers')

    return answer instanceof Error
      ? Promise.reject(answer)
      : Promise.resolve(answer)
  })
}

/**
 * Makes the error Node's fetch throws for a network failure.
 *
 * @param {string} code The error code, such as ENOTFOUND.
 * @returns {TypeError} The error.
 */
function networkError(code: string): TypeError {
  return new TypeError('fetch failed', { cause: { code } })
}

describe('checkTarget', () => {
  it('counts any 2xx or 3xx answer as up by default', async () => {
    const fetchFunction = fakeFetch(new Response(null, { status: 204 }))

    const result = await checkTarget(createTarget('website'), fetchFunction, 0)

    expect(result).toMatchObject({
      targetId: 'website',
      up: true,
      slow: false,
      statusCode: 204,
      error: '',
    })
    expect(fetchFunction).toHaveBeenCalledOnce()
    expect(fetchFunction.mock.calls[0]?.[1]).toMatchObject({
      method: 'GET',
      redirect: 'follow',
    })
  })

  it('tries once more before calling a target down', async () => {
    const fetchFunction = fakeFetch(
      new Response('Busy', { status: 503 }),
      new Response('OK', { status: 200 }),
    )

    const result = await checkTarget(createTarget('api'), fetchFunction, 0)

    expect(result.up).toBe(true)
    expect(fetchFunction).toHaveBeenCalledTimes(2)
  })

  it('reports the status code when both tries fail', async () => {
    const result = await checkTarget(
      createTarget('api'),
      fakeFetch(
        new Response('', { status: 503 }),
        new Response('', { status: 502 }),
      ),
      0,
    )

    expect(result).toMatchObject({
      up: false,
      statusCode: 502,
      error: 'HTTP 502',
    })
  })

  it('checks for expected status codes and text', async () => {
    const strict = createTarget('api', { expectedStatus: [401] })
    const text = createTarget('website', { contains: 'Welcome' })

    const unauthorised = await checkTarget(
      strict,
      fakeFetch(new Response('', { status: 401 })),
      0,
    )
    const missing = await checkTarget(
      text,
      fakeFetch(
        new Response('Maintenance', { status: 200 }),
        new Response('Maintenance', { status: 200 }),
      ),
      0,
    )

    expect(unauthorised.up).toBe(true)
    expect(missing).toMatchObject({
      up: false,
      error: 'The expected text was missing from the response',
    })
  })

  it('describes timeouts and network errors in plain words', async () => {
    const timeout = new DOMException('The operation timed out.', 'TimeoutError')

    const timedOut = await checkTarget(
      createTarget('api', { timeoutMilliseconds: 5000 }),
      fakeFetch(timeout, timeout),
      0,
    )
    const unknownHost = await checkTarget(
      createTarget('website'),
      fakeFetch(networkError('ENOTFOUND'), networkError('ENOTFOUND')),
      0,
    )
    const oddCode = await checkTarget(
      createTarget('website'),
      fakeFetch(networkError('EPROTO'), networkError('EPROTO')),
      0,
    )

    expect(timedOut.error).toBe('No response within 5 seconds')
    expect(unknownHost.error).toBe("The domain name didn't resolve")
    expect(oddCode.error).toBe('The request failed (EPROTO)')
  })

  it('marks an answer slower than the limit as slow', async () => {
    const result = await checkTarget(
      createTarget('website', { slowAfterMilliseconds: 0 }),
      vi.fn<typeof fetch>(async () => {
        await new Promise(resolve => {
          setTimeout(resolve, 5)
        })
        return new Response('OK')
      }),
      0,
    )

    expect(result.slow).toBe(true)
    expect(describeResult('Website', result)).toMatch(
      /^slow {2}Website: HTTP 200 in \d+ ms$/u,
    )
  })
})
