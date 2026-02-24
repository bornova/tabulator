import Renderer from '../Renderer.js'

export default class VirtualDomHorizontal extends Renderer {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.leftCol = 0
    this.rightCol = 0
    this.scrollLeft = 0

    this.vDomScrollPosLeft = 0
    this.vDomScrollPosRight = 0

    this.vDomPadLeft = 0
    this.vDomPadRight = 0

    this.fitDataColAvg = 0

    this.windowBuffer = 200 // pixel margin to make column visible before it is shown on screen

    this.visibleRows = null

    this.initialized = false
    this.isFitData = false

    this.columns = []
  }

  /**
   * Initialize renderer listeners and compatibility state.
   * @returns {void}
   */
  initialize() {
    this.compatibilityCheck()
    this.layoutCheck()
    this.vertScrollListen()
  }

  /**
   * Warn about unsupported feature combinations.
   * @returns {void}
   */
  compatibilityCheck() {
    if (this.options('layout') === 'fitDataTable') {
      console.warn('Horizontal Virtual DOM is not compatible with fitDataTable layout mode')
    }

    if (this.options('responsiveLayout')) {
      console.warn('Horizontal Virtual DOM is not compatible with responsive columns')
    }

    if (this.options('rtl')) {
      console.warn('Horizontal Virtual DOM is not currently compatible with RTL text direction')
    }
  }

  /**
   * Cache layout mode flags used by horizontal virtualization.
   * @returns {void}
   */
  layoutCheck() {
    this.isFitData = this.options('layout').startsWith('fitData')
  }

  /**
   * Subscribe to vertical/data events that invalidate visible row cache.
   * @returns {void}
   */
  vertScrollListen() {
    this.subscribe('scroll-vertical', this.clearVisRowCache.bind(this))
    this.subscribe('data-refreshed', this.clearVisRowCache.bind(this))
  }

  /**
   * Clear cached visible rows.
   * @returns {void}
   */
  clearVisRowCache() {
    this.visibleRows = null
  }

  /// ///////////////////////////////////
  /// ////// Public Functions ///////////
  /// ///////////////////////////////////

  /**
   * Handle row cell rendering trigger after data changes.
   * @returns {void}
   */
  renderColumns() {
    this.dataChange()
  }

  /**
   * Handle horizontal scroll updates.
   * @param {number} left Horizontal scroll position.
   * @returns {void}
   */
  scrollColumns(left) {
    if (this.scrollLeft !== left) {
      this.scrollLeft = left

      this.scroll(left - (this.vDomScrollPosLeft + this.windowBuffer))
    }
  }

  /**
   * Compute the horizontal render buffer size.
   * @returns {void}
   */
  calcWindowBuffer() {
    let buffer = this.elementVertical.clientWidth

    this.table.columnManager.columnsByIndex.forEach((column) => {
      if (column.visible) {
        const width = column.getWidth()

        if (width > buffer) {
          buffer = width
        }
      }
    })

    this.windowBuffer = buffer * 2
  }

  /**
   * Recompute visible horizontal column window and optionally redraw rows.
   * @param {boolean} [update] Whether this is an update cycle.
   * @param {boolean} [blockRedraw] Prevent row redraw when true.
   * @returns {void}
   */
  rerenderColumns(update, blockRedraw) {
    const old = {
      cols: this.columns,
      leftCol: this.leftCol,
      rightCol: this.rightCol
    }
    let colPos = 0

    if (update && !this.initialized) {
      return
    }

    this.clear()

    this.calcWindowBuffer()

    this.scrollLeft = this.elementVertical.scrollLeft

    this.vDomScrollPosLeft = this.scrollLeft - this.windowBuffer
    this.vDomScrollPosRight = this.scrollLeft + this.elementVertical.clientWidth + this.windowBuffer

    this.table.columnManager.columnsByIndex.forEach((column) => {
      const config = {}
      let width

      if (column.visible) {
        if (!column.modules.frozen) {
          width = column.getWidth()

          config.leftPos = colPos
          config.rightPos = colPos + width

          config.width = width

          if (this.isFitData) {
            config.fitDataCheck = column.modules.vdomHoz ? column.modules.vdomHoz.fitDataCheck : true
          }

          if (colPos + width > this.vDomScrollPosLeft && colPos < this.vDomScrollPosRight) {
            // column is visible

            if (this.leftCol === -1) {
              this.leftCol = this.columns.length
              this.vDomPadLeft = colPos
            }

            this.rightCol = this.columns.length
          } else {
            // column is hidden
            if (this.leftCol !== -1) {
              this.vDomPadRight += width
            }
          }

          this.columns.push(column)

          column.modules.vdomHoz = config

          colPos += width
        }
      }
    })

    this.tableElement.style.paddingLeft = `${this.vDomPadLeft}px`
    this.tableElement.style.paddingRight = `${this.vDomPadRight}px`

    this.initialized = true

    if (!blockRedraw) {
      if (!update || this.reinitChanged(old)) {
        this.reinitializeRows()
      }
    }

    this.elementVertical.scrollLeft = this.scrollLeft
  }

  /**
   * Render cells for a row based on current virtual window.
   * @param {object} row Internal row instance.
   * @returns {void}
   */
  renderRowCells(row) {
    if (this.initialized) {
      this.initializeRow(row)
    } else {
      const rowFrag = document.createDocumentFragment()
      row.cells.forEach((cell) => {
        rowFrag.appendChild(cell.getElement())
      })
      row.element.appendChild(rowFrag)

      row.cells.forEach((cell) => {
        cell.cellRendered()
      })
    }
  }

  /**
   * Re-render cells for a single row.
   * @param {object} row Internal row instance.
   * @param {boolean} [force] Force full row reinitialization.
   * @returns {void}
   */
  rerenderRowCells(row, force) {
    this.reinitializeRow(row, force)
  }

  /**
   * Reinitialize widths for currently visible columns.
   * @returns {void}
   */
  reinitializeColumnWidths() {
    for (let i = this.leftCol; i <= this.rightCol; i++) {
      const col = this.columns[i]

      if (col) {
        col.reinitializeWidth()
      }
    }
  }

  /// ///////////////////////////////////
  /// ///// Internal Rendering //////////
  /// ///////////////////////////////////

  /**
   * Reset initialization state.
   * @returns {void}
   */
  deinitialize() {
    this.initialized = false
  }

  /**
   * Clear horizontal virtual DOM window state.
   * @returns {void}
   */
  clear() {
    this.columns = []

    this.leftCol = -1
    this.rightCol = 0

    this.vDomScrollPosLeft = 0
    this.vDomScrollPosRight = 0
    this.vDomPadLeft = 0
    this.vDomPadRight = 0
  }

  /**
   * Handle data-driven width changes that may affect virtual columns.
   * @returns {void}
   */
  dataChange() {
    let change = false
    let row
    let rowEl

    if (this.isFitData) {
      this.table.columnManager.columnsByIndex.forEach((column) => {
        if (!column.definition.width && column.visible) {
          change = true
        }
      })

      if (change && this.table.rowManager.getDisplayRows().length) {
        this.vDomScrollPosRight = this.scrollLeft + this.elementVertical.clientWidth + this.windowBuffer

        row = this.chain('rows-sample', [1], [], () => {
          return this.table.rowManager.getDisplayRows()
        })[0]

        if (row) {
          rowEl = row.getElement()

          row.generateCells()

          this.tableElement.appendChild(rowEl)

          for (let colEnd = 0; colEnd < row.cells.length; colEnd++) {
            const cell = row.cells[colEnd]
            rowEl.appendChild(cell.getElement())

            cell.column.reinitializeWidth()
          }

          if (rowEl.parentNode) {
            rowEl.parentNode.removeChild(rowEl)
          }

          this.rerenderColumns(false, true)
        }
      }
    } else {
      if (this.options('layout') === 'fitColumns') {
        this.layoutRefresh()
        this.rerenderColumns(false, true)
      }
    }
  }

  /**
   * Determine whether visible column window changed from previous state.
   * @param {{cols:Array<object>,leftCol:number,rightCol:number}} old Previous window state.
   * @returns {boolean}
   */
  reinitChanged(old) {
    if (old.cols.length !== this.columns.length || old.leftCol !== this.leftCol || old.rightCol !== this.rightCol) {
      return true
    }

    return old.cols.some((col, index) => col !== this.columns[index])
  }

  /**
   * Reinitialize all rows for current visible column window.
   * @returns {void}
   */
  reinitializeRows() {
    const visibleRows = this.getVisibleRows()
    const otherRows = this.table.rowManager.getRows().filter((row) => !visibleRows.includes(row))

    visibleRows.forEach((row) => {
      this.reinitializeRow(row, true)
    })

    otherRows.forEach((row) => {
      row.deinitialize()
    })
  }

  /**
   * Get cached visible rows, populating cache when needed.
   * @returns {Array<object>}
   */
  getVisibleRows() {
    if (!this.visibleRows) {
      this.visibleRows = this.table.rowManager.getVisibleRows()
    }

    return this.visibleRows
  }

  /**
   * Adjust rendered columns based on horizontal scroll delta.
   * @param {number} diff Horizontal delta.
   * @returns {void}
   */
  scroll(diff) {
    this.vDomScrollPosLeft += diff
    this.vDomScrollPosRight += diff

    if (Math.abs(diff) > this.windowBuffer / 2) {
      this.rerenderColumns()
    } else {
      if (diff > 0) {
        // scroll right
        this.addColRight()
        this.removeColLeft()
      } else {
        // scroll left
        this.addColLeft()
        this.removeColRight()
      }
    }
  }

  /**
   * Shift cached virtual positions for a range of columns.
   * @param {number} start Start index (inclusive).
   * @param {number} end End index (exclusive).
   * @param {number} diff Position adjustment delta.
   * @returns {void}
   */
  colPositionAdjust(start, end, diff) {
    for (let i = start; i < end; i++) {
      const column = this.columns[i]

      column.modules.vdomHoz.leftPos += diff
      column.modules.vdomHoz.rightPos += diff
    }
  }

  /**
   * Add columns on the right side as they enter the virtual window.
   * @returns {void}
   */
  addColRight() {
    let changes = false
    let working = true

    while (working) {
      const column = this.columns[this.rightCol + 1]

      if (column) {
        if (column.modules.vdomHoz.leftPos <= this.vDomScrollPosRight) {
          changes = true

          this.getVisibleRows().forEach((row) => {
            if (row.type !== 'group') {
              const cell = row.getCell(column)
              row
                .getElement()
                .insertBefore(cell.getElement(), row.getCell(this.columns[this.rightCol]).getElement().nextSibling)
              cell.cellRendered()
            }
          })

          this.fitDataColActualWidthCheck(column)

          this.rightCol++ // Don't move this below the >= check below

          this.getVisibleRows().forEach((row) => {
            if (row.type !== 'group') {
              row.modules.vdomHoz.rightCol = this.rightCol
            }
          })

          if (this.rightCol >= this.columns.length - 1) {
            this.vDomPadRight = 0
          } else {
            this.vDomPadRight -= column.getWidth()
          }
        } else {
          working = false
        }
      } else {
        working = false
      }
    }

    if (changes) {
      this.tableElement.style.paddingRight = `${this.vDomPadRight}px`
    }
  }

  /**
   * Add columns on the left side as they enter the virtual window.
   * @returns {void}
   */
  addColLeft() {
    let changes = false
    let working = true

    while (working) {
      const column = this.columns[this.leftCol - 1]

      if (column) {
        if (column.modules.vdomHoz.rightPos >= this.vDomScrollPosLeft) {
          changes = true

          this.getVisibleRows().forEach((row) => {
            if (row.type !== 'group') {
              const cell = row.getCell(column)
              row.getElement().insertBefore(cell.getElement(), row.getCell(this.columns[this.leftCol]).getElement())
              cell.cellRendered()
            }
          })

          this.leftCol-- // don't move this below the <= check below

          this.getVisibleRows().forEach((row) => {
            if (row.type !== 'group') {
              row.modules.vdomHoz.leftCol = this.leftCol
            }
          })

          if (this.leftCol <= 0) {
            // replicating logic in addColRight
            this.vDomPadLeft = 0
          } else {
            this.vDomPadLeft -= column.getWidth()
          }

          const diff = this.fitDataColActualWidthCheck(column)

          if (diff) {
            this.scrollLeft = this.elementVertical.scrollLeft = this.elementVertical.scrollLeft + diff
            this.vDomPadRight -= diff
          }
        } else {
          working = false
        }
      } else {
        working = false
      }
    }

    if (changes) {
      this.tableElement.style.paddingLeft = `${this.vDomPadLeft}px`
    }
  }

  /**
   * Remove columns that moved beyond the right virtual boundary.
   * @returns {void}
   */
  removeColRight() {
    let changes = false
    let working = true

    while (working) {
      const column = this.columns[this.rightCol]

      if (column) {
        if (column.modules.vdomHoz.leftPos > this.vDomScrollPosRight) {
          changes = true

          this.getVisibleRows().forEach((row) => {
            if (row.type !== 'group') {
              const cell = row.getCell(column)

              try {
                row.getElement().removeChild(cell.getElement())
              } catch (ex) {
                console.warn('Could not removeColRight', ex.message)
              }
            }
          })

          this.vDomPadRight += column.getWidth()
          this.rightCol--

          this.getVisibleRows().forEach((row) => {
            if (row.type !== 'group') {
              row.modules.vdomHoz.rightCol = this.rightCol
            }
          })
        } else {
          working = false
        }
      } else {
        working = false
      }
    }

    if (changes) {
      this.tableElement.style.paddingRight = `${this.vDomPadRight}px`
    }
  }

  /**
   * Remove columns that moved beyond the left virtual boundary.
   * @returns {void}
   */
  removeColLeft() {
    let changes = false
    let working = true

    while (working) {
      const column = this.columns[this.leftCol]

      if (column) {
        if (column.modules.vdomHoz.rightPos < this.vDomScrollPosLeft) {
          changes = true

          this.getVisibleRows().forEach((row) => {
            if (row.type !== 'group') {
              const cell = row.getCell(column)

              try {
                row.getElement().removeChild(cell.getElement())
              } catch (ex) {
                console.warn('Could not removeColLeft', ex.message)
              }
            }
          })

          this.vDomPadLeft += column.getWidth()
          this.leftCol++

          this.getVisibleRows().forEach((row) => {
            if (row.type !== 'group') {
              row.modules.vdomHoz.leftCol = this.leftCol
            }
          })
        } else {
          working = false
        }
      } else {
        working = false
      }
    }

    if (changes) {
      this.tableElement.style.paddingLeft = `${this.vDomPadLeft}px`
    }
  }

  /**
   * Recheck actual width for fitData columns and propagate offsets.
   * @param {object} column Internal column instance.
   * @returns {number|undefined}
   */
  fitDataColActualWidthCheck(column) {
    let newWidth, widthDiff

    if (column.modules.vdomHoz.fitDataCheck) {
      column.reinitializeWidth()

      newWidth = column.getWidth()
      widthDiff = newWidth - column.modules.vdomHoz.width

      if (widthDiff) {
        column.modules.vdomHoz.rightPos += widthDiff
        column.modules.vdomHoz.width = newWidth
        this.colPositionAdjust(this.columns.indexOf(column) + 1, this.columns.length, widthDiff)
      }

      column.modules.vdomHoz.fitDataCheck = false
    }

    return widthDiff
  }

  /**
   * Initialize a row with cells inside current virtual window and frozen columns.
   * @param {object} row Internal row instance.
   * @returns {void}
   */
  initializeRow(row) {
    if (row.type !== 'group') {
      row.modules.vdomHoz = {
        leftCol: this.leftCol,
        rightCol: this.rightCol
      }

      if (this.table.modules.frozenColumns) {
        this.table.modules.frozenColumns.leftColumns.forEach((column) => {
          this.appendCell(row, column)
        })
      }

      for (let i = this.leftCol; i <= this.rightCol; i++) {
        this.appendCell(row, this.columns[i])
      }

      if (this.table.modules.frozenColumns) {
        this.table.modules.frozenColumns.rightColumns.forEach((column) => {
          this.appendCell(row, column)
        })
      }
    }
  }

  /**
   * Append a column cell to a row element.
   * @param {object} row Internal row instance.
   * @param {object} column Internal column instance.
   * @returns {void}
   */
  appendCell(row, column) {
    if (column && column.visible) {
      const cell = row.getCell(column)

      row.getElement().appendChild(cell.getElement())
      cell.cellRendered()
    }
  }

  /**
   * Reinitialize a row when visible column bounds have changed.
   * @param {object} row Internal row instance.
   * @param {boolean} [force] Force row reset.
   * @returns {void}
   */
  reinitializeRow(row, force) {
    if (row.type !== 'group') {
      if (
        force ||
        !row.modules.vdomHoz ||
        row.modules.vdomHoz.leftCol !== this.leftCol ||
        row.modules.vdomHoz.rightCol !== this.rightCol
      ) {
        const rowEl = row.getElement()
        rowEl.replaceChildren()

        this.initializeRow(row)
      }
    }
  }
}
