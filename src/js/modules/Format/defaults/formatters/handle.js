/**
 * Render a row handle icon and class.
 *
 * @param {Object} cell Cell component.
 * @param {Object} formatterParams Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {string} Handle markup.
 */
export default function (cell, formatterParams, onRendered) {
  const element = cell.getElement()
  const handleIcon =
    "<div class='tabulator-row-handle-box'><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div></div>"

  element.classList.add('tabulator-row-handle')

  return handleIcon
}
