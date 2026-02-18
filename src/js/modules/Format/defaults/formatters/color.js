/**
 * Apply a cell background color from value.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {Object} formatterParams Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {string} Empty string.
 */
export default function (cell, formatterParams, onRendered) {
  const element = cell.getElement()
  const color = this.sanitizeHTML(cell.getValue())

  element.style.backgroundColor = color
  return ''
}
