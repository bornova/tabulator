/**
 * Render multi-line plain text.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @returns {string} Sanitized text.
 */
export default function (cell) {
  const element = cell.getElement()

  if (element.style.whiteSpace !== 'pre-wrap') {
    element.style.whiteSpace = 'pre-wrap'
  }

  return this.emptyToSpace(this.sanitizeHTML(cell.getValue()))
}
