import type { Plugin } from 'vite'
import { describe, expect, it } from 'vitest'
import { pageConfigPlugin } from '../build/page-config-plugin.ts'
import { createConfig } from './fixtures.ts'

/**
 * Runs a plugin hook that may be a function or an object with a handler.
 *
 * @param {Plugin['transformIndexHtml']} hook The hook.
 * @param {string} html The page.
 * @returns {string} The transformed page.
 */
function transform(hook: Plugin['transformIndexHtml'], html: string): string {
  const handler = typeof hook === 'function' ? hook : hook?.handler
  const result = handler?.call(
    {} as ThisParameterType<NonNullable<typeof handler>>,
    html,
    { path: '/index.html', filename: 'index.html' },
  )

  return typeof result === 'string' ? result : ''
}

describe('pageConfigPlugin', () => {
  it('escapes the title and description and keeps target URLs out of the page', () => {
    const config = {
      ...createConfig(),
      title: 'Acme & Sons <status>',
      description: 'Checks for "everything" $& more',
    }
    const plugin = pageConfigPlugin(config)
    const html = transform(
      plugin.transformIndexHtml,
      '<title>__PAGE_TITLE__</title><meta content="__META_DESCRIPTION__"><p>__PAGE_DESCRIPTION__</p>',
    )
    const hook = plugin.config
    const handler = typeof hook === 'function' ? hook : hook?.handler
    const viteConfig = handler?.call(
      {} as ThisParameterType<NonNullable<typeof handler>>,
      {},
      { command: 'build', mode: 'production' },
    )
    const defined = JSON.stringify(viteConfig)

    expect(html).toBe(
      '<title>Acme &amp; Sons &lt;status&gt;</title><meta content="Checks for &quot;everything&quot; $&amp; more"><p>Checks for &quot;everything&quot; $&amp; more</p>',
    )
    expect(defined).toContain('Acme & Sons')
    expect(defined).not.toContain('example.test')
  })
})
