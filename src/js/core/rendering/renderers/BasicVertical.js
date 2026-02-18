import Renderer from '../Renderer.js'
import Helpers from '../../tools/Helpers.js'

export default class BasicVertical extends Renderer {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.verticalFillMode = 'fill'

    this.scrollTop = 0
    this.scrollLeft = 0
  }

  /**
   * Clear all rendered rows and reset table element styles.
   * @returns {void}
   */
  clearRows() {
    const element = this.tableElement

    element.replaceChildren()

    element.scrollTop = 0
    element.scrollLeft = 0

    element.style.minWidth = ''
    element.style.minHeight = ''
    element.style.display = ''
    element.style.visibility = ''
  }

  /**
   * Render all display rows into the table element.
   * @returns {void}
   */
  renderRows() {
    const element = this.tableElement
    let onlyGroupHeaders = true
    const tableFrag = document.createDocumentFragment()
    const rows = this.rows()

    rows.forEach((row, index) => {
      this.styleRow(row, index)
      row.initialize(false, true)

      if (row.type !== 'group') {
        onlyGroupHeaders = false
      }

      tableFrag.appendChild(row.getElement())
    })

    element.appendChild(tableFrag)

    rows.forEach((row) => {
      row.rendered()

      if (!row.heightInitialized) {
        row.calcHeight(true)
      }
    })

    rows.forEach((row) => {
      if (!row.heightInitialized) {
        row.setCellHeight()
      }
    })

    element.style.minWidth = onlyGroupHeaders ? `${this.table.columnManager.getWidth()}px` : ''
  }

  /**
   * Re-render all rows with an optional callback between clear and render.
   * @param {Function} [callback] Callback executed after clear and before render.
   * @returns {void}
   */
  rerenderRows(callback) {
    this.clearRows()

    if (callback) {
      callback()
    }

    this.renderRows()

    if (!this.rows().length) {
      this.table.rowManager.tableEmpty()
    }
  }

  /**
   * Determine whether a row is nearer to the top edge than the bottom edge.
   * @param {object} row Internal row instance.
   * @returns {boolean}
   */
  scrollToRowNearestTop(row) {
    const rowTop = Helpers.elOffset(row.getElement()).top

    return !(
      Math.abs(this.elementVertical.scrollTop - rowTop) >
      Math.abs(this.elementVertical.scrollTop + this.elementVertical.clientHeight - rowTop)
    )
  }

  /**
   * Scroll vertically to bring a row into view.
   * @param {object} row Internal row instance.
   * @returns {void}
   */
  scrollToRow(row) {
    const rowEl = row.getElement()

    this.elementVertical.scrollTop =
      Helpers.elOffset(rowEl).top - Helpers.elOffset(this.elementVertical).top + this.elementVertical.scrollTop
  }

  /**
   * Return rows currently considered visible.
   * @param {boolean} [includingBuffer] Included for renderer API compatibility.
   * @returns {Array<object>}
   */
  visibleRows(includingBuffer) {
    return this.rows()
  }
}
