export default function (cell, formatterParams, onRendered) {
  const element = cell.getElement()
  const handleIcon =
    "<div class='tabulator-row-handle-box'><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div><div class='tabulator-row-handle-bar'></div></div>"

  element.classList.add('tabulator-row-handle')

  return handleIcon
}
