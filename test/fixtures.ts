import type {
  CheckResult,
  StatusConfig,
  TargetConfig,
} from '../shared/types.ts'

/**
 * Makes a target with the defaults readConfig would fill in.
 *
 * @param {string} id The target's id.
 * @param {Partial<TargetConfig>} details Settings to change.
 * @returns {TargetConfig} The target.
 */
function createTarget(
  id: string,
  details: Partial<TargetConfig> = {},
): TargetConfig {
  return {
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    group: 'Public',
    url: `https://${id}.example.test/`,
    method: 'GET',
    expectedStatus: [],
    contains: '',
    timeoutMilliseconds: 10_000,
    slowAfterMilliseconds: 3000,
    ...details,
  }
}

/**
 * Makes a config with a website and an API.
 *
 * @returns {StatusConfig} The config.
 */
function createConfig(): StatusConfig {
  return {
    title: 'Acme status',
    description: '',
    groups: ['Public'],
    intervalMinutes: 5,
    targets: [createTarget('website'), createTarget('api')],
    sources: [],
  }
}

/**
 * Makes a check result.
 *
 * @param {string} targetId The target's id.
 * @param {Partial<CheckResult>} details What to change from an up, fast check.
 * @returns {CheckResult} The result.
 */
function createResult(
  targetId: string,
  details: Partial<CheckResult> = {},
): CheckResult {
  return {
    targetId,
    up: true,
    slow: false,
    latencyMilliseconds: 120,
    statusCode: 200,
    error: '',
    ...details,
  }
}

export { createConfig, createResult, createTarget }
