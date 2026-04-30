/**
 * Render current row position.
 *
 * @param {Object} cell Cell component.
 * @param {{relativeToPage?: boolean}} formatterParams Formatter parameters.
 * @returns {HTMLSpanElement} Row number element.
 */
export default function (cell, formatterParams) {
  formatterParams ??= {}

  const content = document.createElement('span')
  const row = cell.getRow()
  const table = cell.getTable()

  row.watchPosition((position) => {
    let displayPosition = position

    if (formatterParams.relativeToPage && table.modExists('page', true)) {
      displayPosition += table.modules.page.getPageSize() * (table.modules.page.getPage() - 1)
    }

    content.innerText = displayPosition
  })

  return content
}
