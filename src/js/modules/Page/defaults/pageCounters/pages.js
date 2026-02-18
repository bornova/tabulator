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

  valueEl.innerHTML = ` ${currentPage} `

  localize.langBind('pagination|counter|of', (value) => {
    ofEl.innerHTML = value
  })

  totalEl.innerHTML = ` ${totalPages} `

  localize.langBind('pagination|counter|pages', (value) => {
    rowsEl.innerHTML = value
  })

  el.appendChild(showingEl)
  el.appendChild(valueEl)
  el.appendChild(ofEl)
  el.appendChild(totalEl)
  el.appendChild(rowsEl)

  return el
}
