/**
 * Apply a cell background color from value.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @returns {string} Empty string.
 */
export default function (cell) {
  const element = cell.getElement()
  const color = this.sanitizeHTML(cell.getValue())

  element.style.backgroundColor = color
  return ''
}
