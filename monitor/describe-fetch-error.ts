/**
 * Network error codes worth putting in plain words. Anything else is shown
 * by its code.
 */
const ERROR_CODES: Readonly<Record<string, string>> = {
  ENOTFOUND: "The domain name didn't resolve",
  EAI_AGAIN: "The domain name didn't resolve",
  ECONNREFUSED: 'The connection was refused',
  ECONNRESET: 'The connection was reset',
  ETIMEDOUT: 'The connection timed out',
  CERT_HAS_EXPIRED: 'The TLS certificate has expired',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'The TLS certificate is self-signed',
  ERR_TLS_CERT_ALTNAME_INVALID: "The TLS certificate doesn't match the domain",
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: "The TLS certificate couldn't be verified",
}

/**
 * Finds the error code Node puts on the cause of a failed fetch.
 *
 * @param {Error} error The error.
 * @returns {string} The code, or an empty string.
 */
function findCode(error: Error): string {
  const { cause } = error

  if (
    typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    typeof cause.code === 'string'
  ) {
    return cause.code
  }

  return ''
}

/**
 * Describes why a request failed, in words the status page can show.
 *
 * @param {Error | undefined} error What fetch threw, when it was an Error.
 * @param {number} timeoutMilliseconds The target's time limit.
 * @returns {string} The description.
 */
function describeFetchError(
  error: Error | undefined,
  timeoutMilliseconds: number,
): string {
  if (!error) {
    return 'The request failed'
  }

  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return `No response within ${String(timeoutMilliseconds / 1000)} seconds`
  }

  const code = findCode(error)

  if (code === '') {
    return 'The request failed'
  }

  return ERROR_CODES[code] ?? `The request failed (${code})`
}

export { describeFetchError }
