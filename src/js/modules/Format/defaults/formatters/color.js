/**
 * Apply a cell background color from value.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @returns {string} Empty string.
 */
export default function (cell) {
  const element = cell.getElement()
  const value = cell.getValue()
  const color = value == null ? '' : this.sanitizeHTML(value)

  element.style.backgroundColor = color
  return ''
}
