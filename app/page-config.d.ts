import type { PageConfig } from '../shared/types.ts'

declare global {
  /**
   * The public part of status.config.json, written into the page at build
   * time by vite.config.ts.
   */
  const __PAGE_CONFIG__: PageConfig
}
