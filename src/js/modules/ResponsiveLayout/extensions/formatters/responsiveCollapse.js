/**
 * Render a responsive collapse toggle control.
 *
 * @param {Object} cell Cell component.
 * @returns {HTMLDivElement} Toggle element.
 */
export default function (cell) {
  const el = document.createElement('div')
  const config = cell.getRow()._row.modules.responsiveLayout
  const table = cell.getTable()

  if (!config) {
    return el
  }

  el.classList.add('tabulator-responsive-collapse-toggle')

  el.innerHTML = `<svg class='tabulator-responsive-collapse-toggle-open' viewbox="0 0 24 24">
  <line x1="7" y1="12" x2="17" y2="12" fill="none" stroke-width="3" stroke-linecap="round" />
  <line y1="7" x1="12" y2="17" x2="12" fill="none" stroke-width="3" stroke-linecap="round" />
</svg>

<svg class='tabulator-responsive-collapse-toggle-close' viewbox="0 0 24 24">
  <line x1="7" y1="12" x2="17" y2="12"  fill="none" stroke-width="3" stroke-linecap="round" />
</svg>`

  cell.getElement().classList.add('tabulator-row-handle')

  const toggleList = (isOpen) => {
    const collapseEl = config.element

    config.open = isOpen

    if (collapseEl) {
      if (config.open) {
        el.classList.add('open')
        collapseEl.style.display = ''
      } else {
        el.classList.remove('open')
        collapseEl.style.display = 'none'
      }
    }
  }

  el.addEventListener('click', (e) => {
    e.stopImmediatePropagation()
    toggleList(!config.open)
    table.rowManager.adjustTableSize()
  })

  toggleList(config.open)

  return el
}
