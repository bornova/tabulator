/**
 * Render sanitized plain text.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @returns {string} Sanitized plain text value.
 */
export default function (cell) {
  const value = this.sanitizeHTML(cell.getValue())

  return this.emptyToSpace(value)
}
