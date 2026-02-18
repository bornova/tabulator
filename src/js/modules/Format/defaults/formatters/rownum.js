export default function (cell, formatterParams, onRendered) {
  const content = document.createElement('span')
  const row = cell.getRow()
  const table = cell.getTable()

  row.watchPosition((position) => {
    let displayPosition = position

    if (formatterParams.relativeToPage) {
      displayPosition += table.modules.page.getPageSize() * (table.modules.page.getPage() - 1)
    }

    content.innerText = displayPosition
  })

  return content
}
