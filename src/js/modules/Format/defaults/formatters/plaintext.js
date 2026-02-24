/**
 * Render sanitized plain text.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @returns {string} Sanitized plain text value.
 */
export default function (cell) {
  return this.emptyToSpace(this.sanitizeHTML(cell.getValue()))
}
