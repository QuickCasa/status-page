import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import { pageConfigPlugin } from './build/page-config-plugin.ts'
import { readConfig } from './shared/read-config.ts'

const statusConfig = readConfig(readFileSync('status.config.json', 'utf8'))

/**
 * Vite builds the page in app/ into site/, using the title, description,
 * groups and sources from status.config.json. A config with problems fails
 * the build with a list of them. The monitor then writes status.json into
 * site/ beside the page.
 */
const config = defineConfig({
  root: 'app',
  base: './',
  plugins: [pageConfigPlugin(statusConfig)],
  build: {
    outDir: '../site',
    emptyOutDir: true,
  },
  test: {
    root: '.',
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
})

export default config
