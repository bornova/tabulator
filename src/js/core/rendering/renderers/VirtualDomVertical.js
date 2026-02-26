import Renderer from '../Renderer.js'
import Helpers from '../../tools/Helpers.js'

export default class VirtualDomVertical extends Renderer {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.verticalFillMode = 'fill'
    this.scrollTop = 0
    this.scrollLeft = 0
    this.vDomRowHeight = 20 // approximation of row heights for padding
    this.vDomTop = 0 // hold position for first rendered row in the virtual DOM
    this.vDomBottom = 0 // hold position for last rendered row in the virtual DOM
    this.vDomScrollPosTop = 0 // last scroll position of the vDom top;
    this.vDomScrollPosBottom = 0 // last scroll position of the vDom bottom;
    this.vDomTopPad = 0 // hold value of padding for top of virtual DOM
    this.vDomBottomPad = 0 // hold value of padding for bottom of virtual DOM
    this.vDomMaxRenderChain = 90 // the maximum number of dom elements that can be rendered in 1 go
    this.vDomWindowBuffer = 0 // window row buffer before removing elements, to smooth scrolling
    this.vDomWindowMinTotalRows = 20 // minimum number of rows to be generated in virtual dom (prevent buffering issues on tables with tall rows)
    this.vDomWindowMinMarginRows = 5 // minimum number of rows to be generated in virtual dom margin
    this.vDomTopNewRows = [] // rows to normalize after appending to optimize render speed
    this.vDomBottomNewRows = [] // rows to normalize after appending to optimize render speed
  }

  /// ///////////////////////////////////
  /// ////// Public Functions ///////////
  /// ///////////////////////////////////

  /**
   * Clear rendered rows and reset virtual DOM state and element styles.
   */
  clearRows() {
    const element = this.tableElement

    element.replaceChildren()

    element.style.paddingTop = ''
    element.style.paddingBottom = ''
    element.style.minHeight = ''
    element.style.display = ''
    element.style.visibility = ''

    this.elementVertical.scrollTop = 0
    this.elementVertical.scrollLeft = 0

    this.scrollTop = 0
    this.scrollLeft = 0

    this.vDomTop = 0
    this.vDomBottom = 0
    this.vDomTopPad = 0
    this.vDomBottomPad = 0
    this.vDomScrollPosTop = 0
    this.vDomScrollPosBottom = 0
  }

  /**
   * Render rows using vertical virtual DOM fill.
   */
  renderRows() {
    this._virtualRenderFill()
  }

  /**
   * Re-render rows while preserving approximate scroll position.
   * @param {Function} [callback] Callback executed between deinit and render.
   */
  rerenderRows(callback) {
    const scrollTop = this.elementVertical.scrollTop
    const left = this.table.rowManager.scrollLeft
    const rows = this.rows()

    let topRow = false
    let topOffset = false

    for (let i = this.vDomTop; i <= this.vDomBottom; i++) {
      if (rows[i]) {
        const diff = scrollTop - rows[i].getElement().offsetTop

        if (topOffset === false || Math.abs(diff) < topOffset) {
          topOffset = diff
          topRow = i
        } else {
          break
        }
      }
    }

    rows.forEach((row) => {
      row.deinitializeHeight()
    })

    if (callback) {
      callback()
    }

    if (this.rows().length) {
      this._virtualRenderFill(topRow === false ? this.rows.length - 1 : topRow, true, topOffset || 0)
    } else {
      this.clear()
      this.table.rowManager.tableEmpty()
    }

    this.scrollColumns(left)
  }

  /**
   * Delegate horizontal scroll updates to row manager.
   * @param {number} left Horizontal scroll position.
   */
  scrollColumns(left) {
    this.table.rowManager.scrollHorizontal(left)
  }

  /**
   * Update virtual row window according to scroll position.
   * @param {number} top Vertical scroll position.
   * @param {boolean} [dir] Scroll direction flag.
   */
  scrollRows(top, dir) {
    const topDiff = top - this.vDomScrollPosTop
    const bottomDiff = top - this.vDomScrollPosBottom
    const margin = this.vDomWindowBuffer * 2
    const rows = this.rows()

    this.scrollTop = top

    if (-topDiff > margin || bottomDiff > margin) {
      // if big scroll redraw table;
      const left = this.table.rowManager.scrollLeft

      this._virtualRenderFill(
        Math.floor((this.elementVertical.scrollTop / this.elementVertical.scrollHeight) * rows.length)
      )

      this.scrollColumns(left)
    } else {
      if (dir) {
        // scrolling up
        if (topDiff < 0) {
          this._addTopRow(rows, -topDiff)
        }

        if (bottomDiff < 0) {
          // hide bottom row if needed
          if (this.vDomScrollHeight - this.scrollTop > this.vDomWindowBuffer) {
            this._removeBottomRow(rows, -bottomDiff)
          } else {
            this.vDomScrollPosBottom = this.scrollTop
          }
        }
      } else {
        if (bottomDiff >= 0) {
          this._addBottomRow(rows, bottomDiff)
        }

        // scrolling down
        if (topDiff >= 0) {
          // hide top row if needed
          if (this.scrollTop > this.vDomWindowBuffer) {
            this._removeTopRow(rows, topDiff)
          } else {
            this.vDomScrollPosTop = this.scrollTop
          }
        }
      }
    }
  }

  /**
   * Recalculate row window buffer based on viewport.
   */
  resize() {
    this.vDomWindowBuffer = this.table.options.renderVerticalBuffer || this.elementVertical.clientHeight
  }

  /**
   * Determine whether a row is nearer to the top rendered edge.
   * @param {object} row Internal row instance.
   * @returns {boolean}
   */
  scrollToRowNearestTop(row) {
    const rowIndex = this.rows().indexOf(row)

    return !(Math.abs(this.vDomTop - rowIndex) > Math.abs(this.vDomBottom - rowIndex))
  }

  /**
   * Scroll and rerender so a row index is brought into view.
   * @param {object} row Internal row instance.
   */
  scrollToRow(row) {
    const index = this.rows().indexOf(row)

    if (index > -1) {
      this._virtualRenderFill(index, true)
    }
  }

  /**
   * Get currently visible rows, optionally including buffer rows.
   * @param {boolean} [includingBuffer] Include buffered rows when true.
   * @returns {Array<object>}
   */
  visibleRows(includingBuffer) {
    const topEdge = this.elementVertical.scrollTop
    const bottomEdge = this.elementVertical.clientHeight + topEdge
    const rows = this.rows()

    let topFound = false
    let topRow = 0
    let bottomRow = 0

    if (includingBuffer) {
      topRow = this.vDomTop
      bottomRow = this.vDomBottom
    } else {
      for (let i = this.vDomTop; i <= this.vDomBottom; i++) {
        if (rows[i]) {
          if (!topFound) {
            if (topEdge - rows[i].getElement().offsetTop >= 0) {
              topRow = i
            } else {
              topFound = true

              if (bottomEdge - rows[i].getElement().offsetTop >= 0) {
                bottomRow = i
              } else {
                break
              }
            }
          } else {
            if (bottomEdge - rows[i].getElement().offsetTop >= 0) {
              bottomRow = i
            } else {
              break
            }
          }
        }
      }
    }

    return rows.slice(topRow, bottomRow + 1)
  }

  /// ///////////////////////////////////
  /// ///// Internal Rendering //////////
  /// ///////////////////////////////////

  // full virtual render
  /**
   * Rebuild the virtual DOM window from a target position.
   * @param {number} [position] Target row index.
   * @param {boolean} [forceMove] Force moving scroll position.
   * @param {number} [offset] Offset from the target row.
   */
  _virtualRenderFill(position, forceMove, offset) {
    const element = this.tableElement
    const holder = this.elementVertical
    const rows = this.rows()
    const rowsCount = rows.length
    const fixedHeight = this.table.rowManager.fixedHeight

    let containerHeight = this.elementVertical.clientHeight
    let avgRowHeight = this.table.options.rowHeight
    let topPad = 0
    let rowsHeight = 0
    let rowHeight = 0
    let heightOccupied
    let topPadHeight = 0
    let totalRowsRendered = 0
    let rowsToRender = 0
    let i
    let index
    let row
    let rowFragment
    let renderedRows
    let resized

    position ??= 0

    offset ??= 0

    if (!position) {
      this.clear()
    } else {
      element.replaceChildren()

      // check if position is too close to bottom of table
      heightOccupied = (rowsCount - position + 1) * this.vDomRowHeight

      if (heightOccupied < containerHeight) {
        position -= Math.ceil((containerHeight - heightOccupied) / this.vDomRowHeight)
        if (position < 0) {
          position = 0
        }
      }

      // calculate initial pad
      topPad = Math.min(
        Math.max(Math.floor(this.vDomWindowBuffer / this.vDomRowHeight), this.vDomWindowMinMarginRows),
        position
      )
      position -= topPad
    }

    if (rowsCount && Helpers.elVisible(this.elementVertical)) {
      this.vDomTop = position
      this.vDomBottom = position - 1

      if (fixedHeight || this.table.options.maxHeight) {
        if (avgRowHeight) {
          rowsToRender = containerHeight / avgRowHeight + this.vDomWindowBuffer / avgRowHeight
        }
        rowsToRender = Math.max(this.vDomWindowMinTotalRows, Math.ceil(rowsToRender))
      } else {
        rowsToRender = rowsCount
      }

      while (
        (rowsToRender === rowsCount ||
          rowsHeight <= containerHeight + this.vDomWindowBuffer ||
          totalRowsRendered < this.vDomWindowMinTotalRows) &&
        this.vDomBottom < rowsCount - 1
      ) {
        renderedRows = []
        rowFragment = document.createDocumentFragment()

        i = 0

        while (i < rowsToRender && this.vDomBottom < rowsCount - 1) {
          ;((index = this.vDomBottom + 1), (row = rows[index]))

          this.styleRow(row, index)

          row.initialize(false, true)
          if (!row.heightInitialized && !this.table.options.rowHeight) {
            row.clearCellHeight()
          }

          rowFragment.appendChild(row.getElement())
          renderedRows.push(row)
          this.vDomBottom++
          i++
        }

        if (!renderedRows.length) {
          break
        }

        element.appendChild(rowFragment)

        // NOTE: The next 3 loops are separate on purpose
        // This is to batch up the dom writes and reads which drastically improves performance

        renderedRows.forEach((row) => {
          row.rendered()

          if (!row.heightInitialized) {
            row.calcHeight(true)
          }
        })

        renderedRows.forEach((row) => {
          if (!row.heightInitialized) {
            row.setCellHeight()
          }
        })

        renderedRows.forEach((row) => {
          rowHeight = row.getHeight()

          if (totalRowsRendered < topPad) {
            topPadHeight += rowHeight
          } else {
            rowsHeight += rowHeight
          }

          if (rowHeight > this.vDomWindowBuffer) {
            this.vDomWindowBuffer = rowHeight * 2
          }

          totalRowsRendered++
        })

        resized = this.table.rowManager.adjustTableSize()
        containerHeight = this.elementVertical.clientHeight
        if (resized && (fixedHeight || this.table.options.maxHeight)) {
          avgRowHeight = rowsHeight / totalRowsRendered

          rowsToRender = Math.max(
            this.vDomWindowMinTotalRows,
            Math.ceil(containerHeight / avgRowHeight + this.vDomWindowBuffer / avgRowHeight)
          )
        }
      }

      if (!position) {
        this.vDomTopPad = 0
        // adjust row height to match average of rendered elements
        this.vDomRowHeight = Math.floor((rowsHeight + topPadHeight) / totalRowsRendered)
        this.vDomBottomPad = this.vDomRowHeight * (rowsCount - this.vDomBottom - 1)

        this.vDomScrollHeight = topPadHeight + rowsHeight + this.vDomBottomPad - containerHeight
      } else {
        this.vDomTopPad = !forceMove ? this.scrollTop - topPadHeight : this.vDomRowHeight * this.vDomTop + offset
        this.vDomBottomPad =
          this.vDomBottom === rowsCount - 1
            ? 0
            : Math.max(this.vDomScrollHeight - this.vDomTopPad - rowsHeight - topPadHeight, 0)
      }

      element.style.paddingTop = `${this.vDomTopPad}px`
      element.style.paddingBottom = `${this.vDomBottomPad}px`

      if (forceMove) {
        this.scrollTop =
          this.vDomTopPad +
          topPadHeight +
          offset -
          (this.elementVertical.scrollWidth > this.elementVertical.clientWidth
            ? this.elementVertical.offsetHeight - containerHeight
            : 0)
      }

      this.scrollTop = Math.min(this.scrollTop, this.elementVertical.scrollHeight - containerHeight)

      // adjust for horizontal scrollbar if present (and not at top of table)
      if (this.elementVertical.scrollWidth > this.elementVertical.clientWidth && forceMove) {
        this.scrollTop += this.elementVertical.offsetHeight - containerHeight
      }

      this.vDomScrollPosTop = this.scrollTop
      this.vDomScrollPosBottom = this.scrollTop

      holder.scrollTop = this.scrollTop

      this.dispatch('render-virtual-fill')
    }
  }

  /**
   * Add rows above the current window while space is available.
   * @param {Array<object>} rows Display rows.
   * @param {number} fillableSpace Available space to fill.
   */
  _addTopRow(rows, fillableSpace) {
    const table = this.tableElement
    const addedRows = []

    let paddingAdjust = 0
    let index = this.vDomTop - 1
    let i = 0
    let working = true

    while (working) {
      if (this.vDomTop) {
        const row = rows[index]

        let rowHeight
        let initialized

        if (row && i < this.vDomMaxRenderChain) {
          rowHeight = row.getHeight() || this.vDomRowHeight
          initialized = row.initialized

          if (fillableSpace >= rowHeight) {
            this.styleRow(row, index)
            table.insertBefore(row.getElement(), table.firstChild)

            if (!row.initialized || !row.heightInitialized) {
              addedRows.push(row)
            }

            row.initialize()

            if (!initialized) {
              rowHeight = row.getElement().offsetHeight

              if (rowHeight > this.vDomWindowBuffer) {
                this.vDomWindowBuffer = rowHeight * 2
              }
            }

            fillableSpace -= rowHeight
            paddingAdjust += rowHeight

            this.vDomTop--
            index--
            i++
          } else {
            working = false
          }
        } else {
          working = false
        }
      } else {
        working = false
      }
    }

    for (const row of addedRows) {
      row.clearCellHeight()
    }

    this._quickNormalizeRowHeight(addedRows)

    if (paddingAdjust) {
      this.vDomTopPad -= paddingAdjust

      if (this.vDomTopPad < 0) {
        this.vDomTopPad = index * this.vDomRowHeight
      }

      if (index < 1) {
        this.vDomTopPad = 0
      }

      table.style.paddingTop = `${this.vDomTopPad}px`
      this.vDomScrollPosTop -= paddingAdjust
    }
  }

  /**
   * Remove rows from the top of the current window.
   * @param {Array<object>} rows Display rows.
   * @param {number} fillableSpace Available space to release.
   */
  _removeTopRow(rows, fillableSpace) {
    const removableRows = []

    let paddingAdjust = 0
    let i = 0
    let working = true

    while (working) {
      const row = rows[this.vDomTop]

      let rowHeight

      if (row && i < this.vDomMaxRenderChain) {
        rowHeight = row.getHeight() || this.vDomRowHeight

        if (fillableSpace >= rowHeight) {
          this.vDomTop++

          fillableSpace -= rowHeight
          paddingAdjust += rowHeight

          removableRows.push(row)
          i++
        } else {
          working = false
        }
      } else {
        working = false
      }
    }

    for (const row of removableRows) {
      const rowEl = row.getElement()

      if (rowEl.parentNode) {
        rowEl.parentNode.removeChild(rowEl)
      }
    }

    if (paddingAdjust) {
      this.vDomTopPad += paddingAdjust
      this.tableElement.style.paddingTop = `${this.vDomTopPad}px`
      this.vDomScrollPosTop += this.vDomTop ? paddingAdjust : paddingAdjust + this.vDomWindowBuffer
    }
  }

  /**
   * Add rows below the current window while space is available.
   * @param {Array<object>} rows Display rows.
   * @param {number} fillableSpace Available space to fill.
   */
  _addBottomRow(rows, fillableSpace) {
    const table = this.tableElement
    const addedRows = []

    let paddingAdjust = 0
    let index = this.vDomBottom + 1
    let i = 0
    let working = true

    while (working) {
      const row = rows[index]

      let rowHeight
      let initialized

      if (row && i < this.vDomMaxRenderChain) {
        rowHeight = row.getHeight() || this.vDomRowHeight
        initialized = row.initialized

        if (fillableSpace >= rowHeight) {
          this.styleRow(row, index)
          table.appendChild(row.getElement())

          if (!row.initialized || !row.heightInitialized) {
            addedRows.push(row)
          }

          row.initialize()

          if (!initialized) {
            rowHeight = row.getElement().offsetHeight

            if (rowHeight > this.vDomWindowBuffer) {
              this.vDomWindowBuffer = rowHeight * 2
            }
          }

          fillableSpace -= rowHeight
          paddingAdjust += rowHeight

          this.vDomBottom++
          index++
          i++
        } else {
          working = false
        }
      } else {
        working = false
      }
    }

    for (const row of addedRows) {
      row.clearCellHeight()
    }

    this._quickNormalizeRowHeight(addedRows)

    if (paddingAdjust) {
      this.vDomBottomPad -= paddingAdjust

      if (this.vDomBottomPad < 0 || index === rows.length - 1) {
        this.vDomBottomPad = 0
      }

      table.style.paddingBottom = `${this.vDomBottomPad}px`
      this.vDomScrollPosBottom += paddingAdjust
    }
  }

  /**
   * Remove rows from the bottom of the current window.
   * @param {Array<object>} rows Display rows.
   * @param {number} fillableSpace Available space to release.
   */
  _removeBottomRow(rows, fillableSpace) {
    const removableRows = []

    let paddingAdjust = 0
    let i = 0
    let working = true

    while (working) {
      const row = rows[this.vDomBottom]

      let rowHeight

      if (row && i < this.vDomMaxRenderChain) {
        rowHeight = row.getHeight() || this.vDomRowHeight

        if (fillableSpace >= rowHeight) {
          this.vDomBottom--

          fillableSpace -= rowHeight
          paddingAdjust += rowHeight

          removableRows.push(row)
          i++
        } else {
          working = false
        }
      } else {
        working = false
      }
    }

    for (const row of removableRows) {
      const rowEl = row.getElement()

      if (rowEl.parentNode) {
        rowEl.parentNode.removeChild(rowEl)
      }
    }

    if (paddingAdjust) {
      this.vDomBottomPad += paddingAdjust

      if (this.vDomBottomPad < 0) {
        this.vDomBottomPad = 0
      }

      this.tableElement.style.paddingBottom = `${this.vDomBottomPad}px`
      this.vDomScrollPosBottom -= paddingAdjust
    }
  }

  /**
   * Normalize heights for a batch of rows.
   * @param {Array<object>} rows Row instances.
   */
  _quickNormalizeRowHeight(rows) {
    for (const row of rows) {
      row.calcHeight()
    }

    for (const row of rows) {
      row.setCellHeight()
    }
  }
}
