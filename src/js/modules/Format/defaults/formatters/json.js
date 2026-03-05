/**
 * Format cell value as JSON text.
 *
 * @param {Object} cell Cell component.
 * @param {{indent?: string|number, multiline?: boolean, replacer?: function|string[]|null}} formatterParams Formatter parameters.
 * @returns {string} JSON-formatted value.
 */
export default function (cell, formatterParams) {
  formatterParams ??= {}

  const indent = formatterParams.indent ?? '\t'
  const multiline = formatterParams.multiline === undefined ? true : formatterParams.multiline
  const replacer = formatterParams.replacer || null
  const value = cell.getValue()
  const element = cell.getElement()

  if (multiline) {
    element.classList.add('tabulator-cell-pre-wrap')
  }

  return JSON.stringify(value, replacer, indent)
}
