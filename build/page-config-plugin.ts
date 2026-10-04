import type { Plugin } from 'vite'
import type { PageConfig, StatusConfig } from '../shared/types.ts'
import { escapeHtml } from './escape-html.ts'

const FALLBACK_DESCRIPTION = 'Live status, uptime and recent incidents.'

/**
 * Writes the public part of status.config.json into the page: the title and
 * description into the HTML, and the groups and sources into the script.
 * Target URLs stay out of the page.
 *
 * @param {StatusConfig} config The config.
 * @returns {Plugin} The Vite plugin.
 */
function pageConfigPlugin(config: StatusConfig): Plugin {
  const title = escapeHtml(config.title)
  const description = escapeHtml(config.description)
  const metaDescription = escapeHtml(config.description || FALLBACK_DESCRIPTION)
  const pageConfig: PageConfig = {
    title: config.title,
    description: config.description,
    groups: config.groups,
    sources: config.sources,
  }

  return {
    name: 'status-page:config',

    config() {
      return {
        define: { __PAGE_CONFIG__: JSON.stringify(pageConfig) },
      }
    },

    transformIndexHtml(html) {
      return html
        .replaceAll('__PAGE_TITLE__', () => title)
        .replaceAll('__PAGE_DESCRIPTION__', () => description)
        .replaceAll('__META_DESCRIPTION__', () => metaDescription)
    },
  }
}

export { pageConfigPlugin }
