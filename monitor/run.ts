import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DOCUMENT_FILE } from '../shared/constants.ts'
import { readConfig } from '../shared/read-config.ts'
import { applyResults } from './apply-results.ts'
import { checkTarget } from './check-target.ts'
import { describeResult } from './describe-result.ts'
import { readPreviousDocument } from './read-previous-document.ts'

// Runs one round of checks: read the config and the last published document,
// check every target, and write the updated document next to the built page.
// The workflow in .github/workflows/status.yml runs this every five minutes.

const OUTPUT_DIRECTORY = 'site'
const ON_GITHUB = process.env.GITHUB_ACTIONS === 'true'

/**
 * Prints a warning, which GitHub also shows on the workflow run's summary.
 *
 * @param {string} message The warning.
 */
function warn(message: string): void {
  console.warn(ON_GITHUB ? `::warning::${message}` : message)
}

/**
 * Checks every target once and writes the updated status document.
 *
 * @returns {Promise<void>} Resolves once the document is written.
 */
async function run(): Promise<void> {
  const config = readConfig(await readFile('status.config.json', 'utf8'))

  if (config.targets.length === 0) {
    console.info('No targets to check. The page reads its configured sources.')
    return
  }

  const outputFile = path.join(OUTPUT_DIRECTORY, DOCUMENT_FILE)
  const previous = await readPreviousDocument(
    process.env.STATUS_PAGE_URL ?? '',
    outputFile,
    warn,
  )
  const now = Date.now()
  const results = await Promise.all(
    config.targets.map(target => checkTarget(target)),
  )
  const statusDocument = applyResults(
    previous,
    config,
    results,
    now,
    ON_GITHUB ? 'GitHub Actions' : '',
  )

  await mkdir(OUTPUT_DIRECTORY, { recursive: true })
  await writeFile(outputFile, JSON.stringify(statusDocument))

  for (const result of results) {
    const target = config.targets.find(entry => entry.id === result.targetId)
    console.info(describeResult(target?.label ?? result.targetId, result))
  }

  console.info(
    previous
      ? `Updated ${outputFile}.`
      : `Wrote ${outputFile} with no earlier history.`,
  )
}

await run()
