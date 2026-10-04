import { normalizeDocument } from '../shared/normalize-document.ts'
import { asObject } from '../shared/read-json.ts'
import type { JsonValue, SourceConfig } from '../shared/types.ts'
import { decodeFirestoreValue } from './decode-firestore-value.ts'
import type { SourceStatus } from './types.ts'

/**
 * Loads one source's status document. A published page reads its own
 * status.json, and other sources can be any JSON address that allows
 * cross-origin requests, including a Firestore REST API document.
 *
 * @param {SourceConfig} source The source.
 * @param {string} baseUrl The page's address, which relative source URLs start from.
 * @param {typeof fetch} fetchFunction The fetch to use, replaceable in tests.
 * @returns {Promise<SourceStatus>} The document, or why there isn't one.
 */
async function loadSource(
  source: SourceConfig,
  baseUrl: string,
  fetchFunction: typeof fetch = fetch,
): Promise<SourceStatus> {
  try {
    const url = new URL(source.url, baseUrl)

    // Skips the browser's and the host's caches, so the page shows the
    // newest check instead of one from ten minutes ago.
    if (url.origin === new URL(baseUrl).origin) {
      url.searchParams.set('fresh', String(Date.now()))
    }

    const response = await fetchFunction(url, { cache: 'no-store' })

    if (!response.ok) {
      return { source, state: 'empty', document: undefined }
    }

    const body = (await response.json()) as JsonValue
    const plain =
      source.format === 'firestore'
        ? decodeFirestoreValue({
            mapValue: { fields: asObject(body)?.fields ?? {} },
          })
        : body
    const status = normalizeDocument(plain)

    return status
      ? { source, state: 'loaded', document: status }
      : { source, state: 'empty', document: undefined }
  } catch {
    return { source, state: 'unreachable', document: undefined }
  }
}

export { loadSource }
