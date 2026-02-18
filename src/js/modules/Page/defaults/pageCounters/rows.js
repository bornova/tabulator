export default function (pageSize, currentRow, currentPage, totalRows, totalPages) {
  const el = document.createElement('span')
  const showingEl = document.createElement('span')
  const valueEl = document.createElement('span')
  const ofEl = document.createElement('span')
  const totalEl = document.createElement('span')
  const rowsEl = document.createElement('span')
  const { localize } = this.table.modules

  localize.langBind('pagination|counter|showing', (value) => {
    showingEl.innerHTML = value
  })

  localize.langBind('pagination|counter|of', (value) => {
    ofEl.innerHTML = value
  })

  localize.langBind('pagination|counter|rows', (value) => {
    rowsEl.innerHTML = value
  })

  if (totalRows) {
    valueEl.innerHTML = ` ${currentRow}-${Math.min(currentRow + pageSize - 1, totalRows)} `

    totalEl.innerHTML = ` ${totalRows} `

    el.appendChild(showingEl)
    el.appendChild(valueEl)
    el.appendChild(ofEl)
    el.appendChild(totalEl)
    el.appendChild(rowsEl)
  } else {
    valueEl.innerHTML = ' 0 '

    el.appendChild(showingEl)
    el.appendChild(valueEl)
    el.appendChild(rowsEl)
  }

  return el
}
