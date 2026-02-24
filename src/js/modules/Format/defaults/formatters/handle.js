/**
 * Render a row handle icon and class.
 *
 * @param {Object} cell Cell component.
 * @returns {string} Handle markup.
 */
export default function (cell) {
  const element = cell.getElement()
  const handleIcon =
    "<div class='tabulator-row-handle-box'><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div></div>"

  element.classList.add('tabulator-row-handle')

  return handleIcon
}
