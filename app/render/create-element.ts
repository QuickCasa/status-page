/**
 * Makes an element with a class and text. Text is always set as text, never
 * as HTML, so nothing in a status document can change the page.
 *
 * @param {K} tag The element's tag.
 * @param {string} className Its classes, separated by spaces.
 * @param {string} text Its text.
 * @returns {HTMLElementTagNameMap[K]} The element.
 */
function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  text = '',
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)

  if (className !== '') {
    element.className = className
  }

  if (text !== '') {
    element.textContent = text
  }

  return element
}

export { createElement }
