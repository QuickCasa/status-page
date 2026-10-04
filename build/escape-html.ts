const ESCAPES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * Escapes text for HTML, in an element or an attribute.
 *
 * @param {string} text The text.
 * @returns {string} The escaped text.
 */
function escapeHtml(text: string): string {
  return text.replaceAll(
    /[&<>"']/gu,
    character => ESCAPES[character] ?? character,
  )
}

export { escapeHtml }
