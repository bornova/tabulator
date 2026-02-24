/**
 * Render page-based pagination counter content.
 *
 * @this {Object}
 * @param {number} pageSize Current page size.
 * @param {number} currentRow First row index in the current page.
 * @param {number} currentPage Current page number.
 * @param {number} totalRows Total row count.
 * @param {number} totalPages Total page count.
 * @returns {HTMLElement} Counter element.
 */
export default function (pageSize, currentRow, currentPage, totalRows, totalPages) {
  const el = document.createElement('span')
  const showingEl = document.createElement('span')
  const valueEl = document.createElement('span')
  const ofEl = document.createElement('span')
  const totalEl = document.createElement('span')
  const rowsEl = document.createElement('span')
  const { localize } = this.table.modules

  if (!localize) {
    el.innerHTML = `${currentPage} / ${totalPages}`
    return el
  }

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
