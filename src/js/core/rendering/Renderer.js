import CoreFeature from '../CoreFeature.js'
import Helpers from '../tools/Helpers.js'

export default class Renderer extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.elementVertical = table.rowManager.element
    this.elementHorizontal = table.columnManager.element
    this.tableElement = table.rowManager.tableElement

    this.verticalFillMode = 'fit' // used by row manager to determine how to size the render area ("fit" - fits container to the contents, "fill" - fills the container without resizing it)
  }

  /// ////////////////////////////////
  /// //// Internal Bindings /////////
  /// ////////////////////////////////

  /**
   * Initialize renderer internals and event bindings.
   * @returns {void}
   */
  initialize() {
    // initialize core functionality
  }

  /**
   * Clear rendered row layout.
   * @returns {void}
   */
  clearRows() {
    // clear down existing rows layout
  }

  /**
   * Clear rendered column layout.
   * @returns {void}
   */
  clearColumns() {
    // clear down existing columns layout
  }

  /**
   * Reinitialize widths for the provided columns.
   * @param {Array<object>} columns Internal column instances.
   * @returns {void}
   */
  reinitializeColumnWidths(columns) {
    // resize columns to fit data
  }

  /**
   * Render rows from a clean state.
   * @returns {void}
   */
  renderRows() {
    // render rows from a clean slate
  }

  /**
   * Render columns from a clean state.
   * @returns {void}
   */
  renderColumns() {
    // render columns from a clean slate
  }

  /**
   * Re-render rows while preserving scroll context when possible.
   * @param {Function} [callback] Optional callback between clear and render steps.
   * @returns {void}
   */
  rerenderRows(callback) {
    // rerender rows and keep position
    callback?.()
  }

  /**
   * Re-render columns.
   * @param {boolean} [update] Whether this is an update pass.
   * @param {boolean} [blockRedraw] Prevent dependent redraw steps when true.
   * @returns {void}
   */
  rerenderColumns(update, blockRedraw) {
    // rerender columns
  }

  /**
   * Render cells for a specific row.
   * @param {object} row Internal row instance.
   * @returns {void}
   */
  renderRowCells(row) {
    // render the cells in a row
  }

  /**
   * Re-render cells for a specific row.
   * @param {object} row Internal row instance.
   * @param {boolean} [force] Force reinitialization when true.
   * @returns {void}
   */
  rerenderRowCells(row, force) {
    // rerender the cells in a row
  }

  /**
   * Handle horizontal scroll updates.
   * @param {number} left Scroll left position.
   * @param {boolean} [dir] Scroll direction flag.
   * @returns {void}
   */
  scrollColumns(left, dir) {
    // handle horizontal scrolling
  }

  /**
   * Handle vertical scroll updates.
   * @param {number} top Scroll top position.
   * @param {boolean} [dir] Scroll direction flag.
   * @returns {void}
   */
  scrollRows(top, dir) {
    // handle vertical scrolling
  }

  /**
   * Handle container resize recalculations without re-rendering.
   * @returns {void}
   */
  resize() {
    // container has resized, carry out any needed recalculations (DO NOT RERENDER IN THIS FUNCTION)
  }

  /**
   * Scroll to a specific row.
   * @param {object} row Internal row instance.
   * @returns {void}
   */
  scrollToRow(row) {
    // scroll to a specific row
  }

  /**
   * Determine whether a row is closer to the top edge than the bottom edge.
   * @param {object} row Internal row instance.
   * @returns {boolean}
   */
  scrollToRowNearestTop(row) {
    // determine weather the row is nearest the top or bottom of the table, return true for top or false for bottom
  }

  /**
   * Return rows currently visible in this renderer.
   * @param {boolean} [includingBuffer] Include buffered rows when true.
   * @returns {Array<object>}
   */
  visibleRows(includingBuffer) {
    // return the visible rows
    return []
  }

  /// ////////////////////////////////
  /// ///// Helper Functions /////////
  /// ////////////////////////////////

  /**
   * Return current display rows.
   * @returns {Array<object>}
   */
  rows() {
    return this.table.rowManager.getDisplayRows()
  }

  /**
   * Apply even/odd styling classes to a row.
   * @param {object} row Internal row instance.
   * @param {number} index Row display index.
   * @returns {void}
   */
  styleRow(row, index) {
    const rowEl = row.getElement()

    const isEven = Boolean(index % 2)
    rowEl.classList.toggle('tabulator-row-even', isEven)
    rowEl.classList.toggle('tabulator-row-odd', !isEven)
  }

  /// ////////////////////////////////
  /// //// External Triggers /////////
  /// //// (DO NOT OVERRIDE) /////////
  /// ////////////////////////////////

  /**
   * Clear current row and column render output.
   * @returns {void}
   */
  clear() {
    // clear down existing layout
    this.clearRows()
    this.clearColumns()
  }

  /**
   * Render rows and columns from a clean state.
   * @returns {void}
   */
  render() {
    // render from a clean slate
    this.renderRows()
    this.renderColumns()
  }

  /**
   * Re-render rows and columns while preserving position when possible.
   * @param {Function} [callback] Optional callback used by row re-render logic.
   * @returns {void}
   */
  rerender(callback) {
    // rerender and keep position
    this.rerenderRows(callback)
    this.rerenderColumns()
  }

  /**
   * Scroll a row to a given position in the viewport.
   * @param {object} row Internal row instance.
   * @param {string} [position] One of top, bottom, middle/center, or nearest.
   * @param {boolean} [ifVisible] Skip scrolling when row is already visible.
   * @returns {Promise<void>}
   */
  scrollToRowPosition(row, position, ifVisible) {
    const rowIndex = this.rows().indexOf(row)
    const rowEl = row.getElement()
    let offset = 0

    return new Promise((resolve, reject) => {
      if (rowIndex > -1) {
        ifVisible ??= this.table.options.scrollToRowIfVisible

        // check row visibility
        if (!ifVisible) {
          if (Helpers.elVisible(rowEl)) {
            offset = Helpers.elOffset(rowEl).top - Helpers.elOffset(this.elementVertical).top

            if (offset > 0 && offset < this.elementVertical.clientHeight - rowEl.offsetHeight) {
              resolve()
              return
            }
          }
        }

        position ??= this.table.options.scrollToRowPosition

        if (position === 'nearest') {
          position = this.scrollToRowNearestTop(row) ? 'top' : 'bottom'
        }

        // scroll to row
        this.scrollToRow(row)

        // align to correct position
        switch (position) {
          case 'middle':
          case 'center':
            if (
              this.elementVertical.scrollHeight - this.elementVertical.scrollTop ===
              this.elementVertical.clientHeight
            ) {
              this.elementVertical.scrollTop =
                this.elementVertical.scrollTop +
                (rowEl.offsetTop - this.elementVertical.scrollTop) -
                (this.elementVertical.scrollHeight - rowEl.offsetTop) / 2
            } else {
              this.elementVertical.scrollTop = this.elementVertical.scrollTop - this.elementVertical.clientHeight / 2
            }

            break

          case 'bottom':
            if (
              this.elementVertical.scrollHeight - this.elementVertical.scrollTop ===
              this.elementVertical.clientHeight
            ) {
              this.elementVertical.scrollTop =
                this.elementVertical.scrollTop -
                (this.elementVertical.scrollHeight - rowEl.offsetTop) +
                rowEl.offsetHeight
            } else {
              this.elementVertical.scrollTop =
                this.elementVertical.scrollTop - this.elementVertical.clientHeight + rowEl.offsetHeight
            }

            break

          case 'top':
            this.elementVertical.scrollTop = rowEl.offsetTop
            break
        }

        resolve()
      } else {
        console.warn('Scroll Error - Row not visible')
        reject('Scroll Error - Row not visible')
      }
    })
  }
}
