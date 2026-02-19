/**
 * Format cell value as JSON text.
 *
 * @param {Object} cell Cell component.
 * @param {{indent?: string|number, multiline?: boolean, replacer?: function|string[]|null}} formatterParams Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {string} JSON-formatted value.
 */
export default function (cell, formatterParams, onRendered) {
  void onRendered
  const indent = formatterParams.indent || '\t'
  const multiline = typeof formatterParams.multiline === 'undefined' ? true : formatterParams.multiline
  const replacer = formatterParams.replacer || null
  const value = cell.getValue()
  const element = cell.getElement()

  if (multiline) {
    element.style.whiteSpace = 'pre-wrap'
  }

  return JSON.stringify(value, replacer, indent)
}
