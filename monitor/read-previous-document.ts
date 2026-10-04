import { readFile } from 'node:fs/promises'
import { DOCUMENT_FILE } from '../shared/constants.ts'
import { normalizeDocument } from '../shared/normalize-document.ts'
import type { JsonValue, StatusDocument } from '../shared/types.ts'

const REQUEST_TIMEOUT_MILLISECONDS = 15_000

/**
 * Parses a document, treating unreadable text as no document.
 *
 * @param {string} text The file's contents.
 * @param {(message: string) => void} warn Reports a problem without stopping.
 * @returns {StatusDocument | undefined} The document.
 */
function parseDocument(
  text: string,
  warn: (message: string) => void,
): StatusDocument | undefined {
  try {
    return normalizeDocument(JSON.parse(text) as JsonValue)
  } catch {
    warn(
      `The published ${DOCUMENT_FILE} isn't valid JSON, so history starts over.`,
    )
    return undefined
  }
}

/**
 * Reads the status document the last run published, which holds the
 * history. The live site is the only place it's kept, so nothing is committed
 * to the repository on each check.
 *
 * A site that isn't published yet answers 404, and history starts from
 * nothing. Any other failure stops the run, because carrying on would publish
 * a document without the history and wipe it.
 *
 * @param {string} pageUrl The published page's address, or an empty string to read the local file instead.
 * @param {string} localFile Where the last local run wrote its document.
 * @param {(message: string) => void} warn Reports a problem without stopping.
 * @param {typeof fetch} fetchFunction The fetch to use, replaceable in tests.
 * @returns {Promise<StatusDocument | undefined>} The previous document, or undefined on the first run.
 */
async function readPreviousDocument(
  pageUrl: string,
  localFile: string,
  warn: (message: string) => void,
  fetchFunction: typeof fetch = fetch,
): Promise<StatusDocument | undefined> {
  if (pageUrl === '') {
    try {
      return parseDocument(await readFile(localFile, 'utf8'), warn)
    } catch {
      return undefined
    }
  }

  const url = new URL(
    DOCUMENT_FILE,
    pageUrl.endsWith('/') ? pageUrl : `${pageUrl}/`,
  )

  // GitHub Pages caches files for up to ten minutes. A new query string
  // every time skips the cache, so the last run's checks are never lost.
  url.searchParams.set('fresh', String(Date.now()))

  const response = await fetchFunction(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
  })

  if (response.status === 404) {
    return undefined
  }

  if (!response.ok) {
    throw new Error(
      `Couldn't read the published ${DOCUMENT_FILE} (HTTP ${String(response.status)}). Stopping so its history isn't overwritten.`,
    )
  }

  return parseDocument(await response.text(), warn)
}

export { readPreviousDocument }
