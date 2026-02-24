import CoreFeature from './CoreFeature.js'
import Row from './row/Row.js'
import RowComponent from './row/RowComponent.js'
import Helpers from './tools/Helpers.js'

import RendererBasicVertical from './rendering/renderers/BasicVertical.js'
import RendererVirtualDomVertical from './rendering/renderers/VirtualDomVertical.js'

export default class RowManager extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.element = this.createHolderElement() // containing element
    this.tableElement = this.createTableElement() // table element
    this.heightFixer = this.createTableElement() // table element
    this.placeholder = null // placeholder element
    this.placeholderContents = null // placeholder element

    this.firstRender = false // handle first render
    this.renderMode = 'virtual' // current rendering mode
    this.fixedHeight = false // current rendering mode

    this.rows = [] // hold row data objects
    this.activeRowsPipeline = [] // hold calculation of active rows
    this.activeRows = [] // rows currently available to on display in the table
    this.activeRowsCount = 0 // count of active rows

    this.displayRows = [] // rows currently on display in the table
    this.displayRowsCount = 0 // count of display rows

    this.scrollTop = 0
    this.scrollLeft = 0

    this.redrawBlock = false // prevent redraws to allow multiple data manipulations before continuing
    this.redrawBlockRestoreConfig = false // store latest redraw function calls for when redraw is needed
    this.redrawBlockRenderInPosition = false // store latest redraw function calls for when redraw is needed

    this.dataPipeline = [] // hold data pipeline tasks
    this.displayPipeline = [] // hold data display pipeline tasks

    this.scrollbarWidth = 0

    this.renderer = null
  }

  /// ///////////// Setup Functions /////////////////

  /**
   * Create row holder element.
   * @returns {HTMLDivElement}
   */
  createHolderElement() {
    const element = document.createElement('div')

    element.classList.add('tabulator-tableholder')
    element.setAttribute('tabindex', 0)
    // el.setAttribute("role", "rowgroup");

    return element
  }

  /**
   * Create table body element.
   * @returns {HTMLDivElement}
   */
  createTableElement() {
    const element = document.createElement('div')

    element.classList.add('tabulator-table')
    element.setAttribute('role', 'rowgroup')

    return element
  }

  /**
   * Initialize placeholder element from options.
   */
  initializePlaceholder() {
    let placeholder = this.table.options.placeholder

    if (typeof placeholder === 'function') {
      placeholder = placeholder.call(this.table)
    }

    placeholder = this.chain('placeholder', [placeholder], placeholder, placeholder) || placeholder

    // configure placeholder element
    if (placeholder) {
      const el = document.createElement('div')
      el.classList.add('tabulator-placeholder')

      if (typeof placeholder === 'string') {
        const contents = document.createElement('div')
        contents.classList.add('tabulator-placeholder-contents')
        contents.innerHTML = placeholder

        el.appendChild(contents)

        this.placeholderContents = contents
      } else if (typeof HTMLElement !== 'undefined' && placeholder instanceof HTMLElement) {
        el.appendChild(placeholder)
        this.placeholderContents = placeholder
      } else {
        console.warn('Invalid placeholder provided, must be string or HTML Element', placeholder)

        this.placeholder = null
      }

      this.placeholder = el
    }
  }

  // return containing element
  /**
   * Get row holder element.
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element
  }

  // return table element
  /**
   * Get table body element.
   * @returns {HTMLElement}
   */
  getTableElement() {
    return this.tableElement
  }

  /**
   * Initialize row manager DOM and scroll handling.
   */
  initialize() {
    this.initializePlaceholder()
    this.initializeRenderer()

    // initialize manager
    this.element.appendChild(this.tableElement)

    this.firstRender = true

    // scroll header along with table body
    this.element.addEventListener('scroll', () => {
      const left = this.element.scrollLeft
      const leftDir = this.scrollLeft > left
      const top = this.element.scrollTop
      const topDir = this.scrollTop > top

      // handle horizontal scrolling
      if (this.scrollLeft !== left) {
        this.scrollLeft = left

        this.dispatch('scroll-horizontal', left, leftDir)
        this.dispatchExternal('scrollHorizontal', left, leftDir)

        this._positionPlaceholder()
      }

      // handle vertical scrolling
      if (this.scrollTop !== top) {
        this.scrollTop = top

        this.renderer.scrollRows(top, topDir)

        this.dispatch('scroll-vertical', top, topDir)
        this.dispatchExternal('scrollVertical', top, topDir)
      }
    })
  }

  /// /////////////// Row Manipulation //////////////////
  /**
   * Find row by object/component/element/index.
   * @param {*} subject Row identifier.
   * @returns {object|boolean}
   */
  findRow(subject) {
    if (typeof subject === 'object') {
      if (subject instanceof Row) {
        // subject is row element
        return subject
      } else if (subject instanceof RowComponent) {
        // subject is public row component
        return subject._getSelf() || false
      } else if (typeof HTMLElement !== 'undefined' && subject instanceof HTMLElement) {
        // subject is a HTML element of the row
        const match = this.rows.find((row) => row.getElement() === subject)

        return match || false
      } else if (subject === null) {
        return false
      }
    } else if (typeof subject === 'undefined') {
      return false
    } else {
      // subject should be treated as the index of the row
      const match = this.rows.find((row) => row.data[this.table.options.index] == subject)

      return match || false
    }

    // catch all for any other type of input
    return false
  }

  /**
   * Find row by raw data object identity.
   * @param {object} data Data object.
   * @returns {object|boolean}
   */
  getRowFromDataObject(data) {
    const match = this.rows.find((row) => row.data === data)

    return match || false
  }

  /**
   * Find displayed row by visible position.
   * @param {number} position Row display position.
   * @returns {object|undefined}
   */
  getRowFromPosition(position) {
    return this.getDisplayRows().find(
      (row) => row.type === 'row' && row.getPosition() === position && row.isDisplayed()
    )
  }

  /**
   * Scroll to a row position.
   * @param {object} row Internal row.
   * @param {string} position Scroll position mode.
   * @param {boolean} ifVisible Skip if visible.
   * @returns {Promise<void>}
   */
  scrollToRow(row, position, ifVisible) {
    return this.renderer.scrollToRowPosition(row, position, ifVisible)
  }

  /// /////////////// Data Handling //////////////////
  /**
   * Set table data.
   * @param {Array<object>} data Data rows.
   * @param {boolean} renderInPosition Preserve render position.
   * @param {boolean} columnsChanged Column schema changed.
   * @returns {Promise<void>}
   */
  setData(data, renderInPosition, columnsChanged) {
    return new Promise((resolve) => {
      if (renderInPosition && this.getDisplayRows().length) {
        if (this.table.options.pagination) {
          this._setDataActual(data, true)
        } else {
          this.reRenderInPosition(() => {
            this._setDataActual(data)
          })
        }
      } else {
        if (this.table.options.autoColumns && columnsChanged && this.table.initialized) {
          this.table.columnManager.generateColumnsFromRowData(data)
        }
        this.resetScroll()

        this._setDataActual(data)
      }

      resolve()
    })
  }

  /**
   * Apply data array to internal row models.
   * @param {Array<object>} data Data rows.
   * @param {boolean} [renderInPosition] Preserve render position.
   */
  _setDataActual(data, renderInPosition) {
    this.dispatchExternal('dataProcessing', data)

    this._wipeElements()

    if (Array.isArray(data)) {
      this.dispatch('data-processing', data)

      data.forEach((def) => {
        if (def && typeof def === 'object') {
          const row = new Row(def, this)
          this.rows.push(row)
        } else {
          console.warn(
            'Data Loading Warning - Invalid row data detected and ignored, expecting object but received:',
            def
          )
        }
      })

      this.refreshActiveData(false, false, renderInPosition)

      this.dispatch('data-processed', data)
      this.dispatchExternal('dataProcessed', data)
    } else {
      console.error(
        'Data Loading Error - Unable to process data due to invalid data type \nExpecting: array \nReceived: ',
        typeof data,
        '\nData:     ',
        data
      )
    }
  }

  /**
   * Remove row elements and reset manager state.
   */
  _wipeElements() {
    this.dispatch('rows-wipe')

    this.destroy()

    this.adjustTableSize()

    this.dispatch('rows-wiped')
  }

  /**
   * Destroy all row instances and clear row collections.
   */
  destroy() {
    this.rows.forEach((row) => {
      row.wipe()
    })

    this.rows = []
    this.activeRows = []
    this.activeRowsPipeline = []
    this.activeRowsCount = 0
    this.displayRows = []
    this.displayRowsCount = 0
  }

  /**
   * Delete a row from all row collections.
   * @param {Row} row Internal row instance.
   * @param {boolean} blockRedraw Prevent redraw after deletion.
   */
  deleteRow(row, blockRedraw) {
    const allIndex = this.rows.indexOf(row)
    const activeIndex = this.activeRows.indexOf(row)

    if (activeIndex > -1) {
      this.activeRows.splice(activeIndex, 1)
    }

    if (allIndex > -1) {
      this.rows.splice(allIndex, 1)
    }

    this.setActiveRows(this.activeRows)

    this.displayRowIterator((rows) => {
      const displayIndex = rows.indexOf(row)

      if (displayIndex > -1) {
        rows.splice(displayIndex, 1)
      }
    })

    if (!blockRedraw) {
      this.reRenderInPosition()
    }

    this.regenerateRowPositions()

    this.dispatchExternal('rowDeleted', row.getComponent())

    if (!this.displayRowsCount) {
      this.tableEmpty()
    }

    if (this.subscribedExternal('dataChanged')) {
      this.dispatchExternal('dataChanged', this.getData())
    }
  }

  /**
   * Add a single row.
   * @param {object|Row} data Row data object or row instance.
   * @param {boolean|string} [pos] Insert position preference.
   * @param {*} [index] Target row/index reference.
   * @param {boolean} [blockRedraw] Prevent redraw after insertion.
   * @returns {Row}
   */
  addRow(data, pos, index, blockRedraw) {
    return this.addRowActual(data, pos, index, blockRedraw)
  }

  // add multiple rows
  /**
   * Add multiple rows.
   * @param {Array<object>|object} data Row data array or single row object.
   * @param {boolean|string} [pos] Insert position preference.
   * @param {*} [index] Target row/index reference.
   * @param {boolean} [refreshDisplayOnly] Refresh only display pipeline when possible.
   * @returns {Promise<Array<Row>>}
   */
  addRows(data, pos, index, refreshDisplayOnly) {
    const rows = []

    return new Promise((resolve) => {
      pos = this.findAddRowPos(pos)

      if (!Array.isArray(data)) {
        data = [data]
      }

      if ((index === undefined && pos) || (index !== undefined && !pos)) {
        data.reverse()
      }

      data.forEach((item) => {
        const row = this.addRow(item, pos, index, true)
        rows.push(row)
        this.dispatch('row-added', row, item, pos, index)
      })

      let useDisplayOnly = !!refreshDisplayOnly

      if (useDisplayOnly) {
        const hasLocalSort =
          this.table.modules.sort &&
          this.table.options.sortMode !== 'remote' &&
          this.table.modules.sort.sortList &&
          this.table.modules.sort.sortList.length

        const hasLocalFilter =
          this.table.modules.filter &&
          this.table.options.filterMode !== 'remote' &&
          ((this.table.modules.filter.filterList && this.table.modules.filter.filterList.length) ||
            (this.table.modules.filter.headerFilters && Object.keys(this.table.modules.filter.headerFilters).length))

        if (hasLocalSort || hasLocalFilter) {
          useDisplayOnly = false
        }
      }

      this.refreshActiveData(useDisplayOnly ? 'displayPipeline' : false, false, true)

      this.regenerateRowPositions()

      if (this.displayRowsCount) {
        this._clearPlaceholder()
      }

      resolve(rows)
    })
  }

  /**
   * Normalize add-row position option into boolean form.
   * @param {boolean|string} [pos] Position keyword or boolean.
   * @returns {boolean}
   */
  findAddRowPos(pos) {
    if (pos === undefined) {
      pos = this.table.options.addRowPos
    }

    if (pos === 'pos') {
      pos = true
    }

    if (pos === 'bottom') {
      pos = false
    }

    return pos
  }

  /**
   * Insert a row into all tracked row arrays.
   * @param {object|Row} data Row data object or row instance.
   * @param {boolean|string} [pos] Insert position preference.
   * @param {*} [index] Target row/index reference.
   * @param {boolean} [blockRedraw] Prevent redraw after insertion.
   * @returns {Row}
   */
  addRowActual(data, pos, index, blockRedraw) {
    const row = data instanceof Row ? data : new Row(data || {}, this)
    let top = this.findAddRowPos(pos)
    let allIndex = -1
    let activeIndex
    let chainResult

    if (!index) {
      chainResult = this.chain('row-adding-position', [row, top], null, { index, top })

      index = chainResult.index
      top = chainResult.top
    }

    if (index !== undefined) {
      index = this.findRow(index)
    }

    index = this.chain('row-adding-index', [row, index, top], null, index)

    if (index) {
      allIndex = this.rows.indexOf(index)
    }

    if (index && allIndex > -1) {
      activeIndex = this.activeRows.indexOf(index)

      this.displayRowIterator((rows) => {
        const displayIndex = rows.indexOf(index)

        if (displayIndex > -1) {
          rows.splice(top ? displayIndex : displayIndex + 1, 0, row)
        }
      })

      if (activeIndex > -1) {
        this.activeRows.splice(top ? activeIndex : activeIndex + 1, 0, row)
      }

      this.rows.splice(top ? allIndex : allIndex + 1, 0, row)
    } else {
      if (top) {
        this.displayRowIterator((rows) => {
          rows.unshift(row)
        })

        this.activeRows.unshift(row)
        this.rows.unshift(row)
      } else {
        this.displayRowIterator((rows) => {
          rows.push(row)
        })

        this.activeRows.push(row)
        this.rows.push(row)
      }
    }

    this.setActiveRows(this.activeRows)

    this.dispatchExternal('rowAdded', row.getComponent())

    if (this.subscribedExternal('dataChanged')) {
      this.dispatchExternal('dataChanged', this.table.rowManager.getData())
    }

    if (!blockRedraw) {
      this.reRenderInPosition()
    }

    return row
  }

  /**
   * Move a row relative to another row.
   * @param {Row} from Row to move.
   * @param {Row} to Target row.
   * @param {boolean} after Insert after target when true.
   */
  moveRow(from, to, after) {
    this.dispatch('row-move', from, to, after)

    this.moveRowActual(from, to, after)

    this.regenerateRowPositions()

    this.dispatch('row-moved', from, to, after)
    this.dispatchExternal('rowMoved', from.getComponent())
  }

  /**
   * Apply row move to all managed row arrays.
   * @param {Row} from Row to move.
   * @param {Row} to Target row.
   * @param {boolean} after Insert after target when true.
   */
  moveRowActual(from, to, after) {
    this.moveRowInArray(this.rows, from, to, after)
    this.moveRowInArray(this.activeRows, from, to, after)

    this.displayRowIterator((rows) => {
      this.moveRowInArray(rows, from, to, after)
    })

    this.dispatch('row-moving', from, to, after)
  }

  /**
   * Move a row inside a specific row array.
   * @param {Array<object>} rows Row array.
   * @param {Row} from Row to move.
   * @param {Row} to Target row.
   * @param {boolean} after Insert after target when true.
   */
  moveRowInArray(rows, from, to, after) {
    let fromIndex, toIndex, start, end

    if (from !== to) {
      fromIndex = rows.indexOf(from)

      if (fromIndex > -1) {
        rows.splice(fromIndex, 1)

        toIndex = rows.indexOf(to)

        if (toIndex > -1) {
          if (after) {
            rows.splice(toIndex + 1, 0, from)
          } else {
            rows.splice(toIndex, 0, from)
          }
        } else {
          rows.splice(fromIndex, 0, from)
        }
      }

      // restyle rows
      if (rows === this.getDisplayRows()) {
        start = fromIndex < toIndex ? fromIndex : toIndex
        end = toIndex > fromIndex ? toIndex : fromIndex + 1

        for (let i = start; i <= end; i++) {
          if (rows[i]) {
            this.styleRow(rows[i], i)
          }
        }
      }
    }
  }

  /**
   * Clear all table data.
   */
  clearData() {
    this.setData([])
  }

  /**
   * Get index of a row in all rows.
   * @param {*} row Row reference.
   * @returns {number|boolean}
   */
  getRowIndex(row) {
    return this.findRowIndex(row, this.rows)
  }

  /**
   * Get index of a row in display rows.
   * @param {*} row Row reference.
   * @returns {number|boolean}
   */
  getDisplayRowIndex(row) {
    const index = this.getDisplayRows().indexOf(row)
    return index > -1 ? index : false
  }

  /**
   * Get next displayed row.
   * @param {*} row Current row reference.
   * @param {boolean} [rowOnly] Limit to actual data rows.
   * @returns {object|boolean}
   */
  nextDisplayRow(row, rowOnly) {
    const index = this.getDisplayRowIndex(row)
    let nextRow = false

    if (index !== false && index < this.displayRowsCount - 1) {
      nextRow = this.getDisplayRows()[index + 1]
    }

    if (nextRow && (!(nextRow instanceof Row) || nextRow.type !== 'row')) {
      return this.nextDisplayRow(nextRow, rowOnly)
    }

    return nextRow
  }

  /**
   * Get previous displayed row.
   * @param {*} row Current row reference.
   * @param {boolean} [rowOnly] Limit to actual data rows.
   * @returns {object|boolean}
   */
  prevDisplayRow(row, rowOnly) {
    const index = this.getDisplayRowIndex(row)
    let prevRow = false

    if (index) {
      prevRow = this.getDisplayRows()[index - 1]
    }

    if (rowOnly && prevRow && (!(prevRow instanceof Row) || prevRow.type !== 'row')) {
      return this.prevDisplayRow(prevRow, rowOnly)
    }

    return prevRow
  }

  /**
   * Find row index within a specific list.
   * @param {*} row Row reference.
   * @param {Array<object>} list Row list to search.
   * @returns {number|boolean}
   */
  findRowIndex(row, list) {
    let rowIndex

    row = this.findRow(row)

    if (row) {
      rowIndex = list.indexOf(row)

      if (rowIndex > -1) {
        return rowIndex
      }
    }

    return false
  }

  /**
   * Get row data for a row set.
   * @param {string|boolean} [active] Row set selector.
   * @param {string} [transform] Data transform mode.
   * @returns {Array<object>}
   */
  getData(active, transform) {
    const rows = this.getRows(active)

    return rows.filter((row) => row.type === 'row').map((row) => row.getData(transform || 'data'))
  }

  /**
   * Get row components for a row set.
   * @param {string|boolean} [active] Row set selector.
   * @returns {Array<object>}
   */
  getComponents(active) {
    const rows = this.getRows(active)

    return rows.map((row) => row.getComponent())
  }

  /**
   * Get row count for a row set.
   * @param {string|boolean} [active] Row set selector.
   * @returns {number}
   */
  getDataCount(active) {
    const rows = this.getRows(active)

    return rows.length
  }

  /**
   * Sync horizontal scroll position.
   * @param {number} left Scroll left offset.
   */
  scrollHorizontal(left) {
    this.scrollLeft = left
    this.element.scrollLeft = left

    this.dispatch('scroll-horizontal', left)
  }

  /**
   * Register a data pipeline handler.
   * @param {Function} handler Pipeline handler.
   * @param {number} priority Handler priority.
   */
  registerDataPipelineHandler(handler, priority) {
    if (priority !== undefined) {
      this.dataPipeline.push({ handler, priority })
      this.dataPipeline.sort((a, b) => a.priority - b.priority)
    } else {
      console.error('Data pipeline handlers must have a priority in order to be registered')
    }
  }

  /**
   * Register a display pipeline handler.
   * @param {Function} handler Pipeline handler.
   * @param {number} priority Handler priority.
   */
  registerDisplayPipelineHandler(handler, priority) {
    if (priority !== undefined) {
      this.displayPipeline.push({ handler, priority })
      this.displayPipeline.sort((a, b) => a.priority - b.priority)
    } else {
      console.error('Display pipeline handlers must have a priority in order to be registered')
    }
  }

  // set active data set
  /**
   * Refresh active row data through configured pipelines.
   * @param {Function|string|false} [handler] Handler or stage to start from.
   * @param {boolean} [skipStage] Skip provided handler stage.
   * @param {boolean} [renderInPosition] Preserve viewport position.
   */
  refreshActiveData(handler, skipStage, renderInPosition) {
    const table = this.table
    let stage
    let index
    const cascadeOrder = ['all', 'dataPipeline', 'display', 'displayPipeline', 'end']

    if (!this.table.destroyed) {
      if (typeof handler === 'function') {
        index = this.dataPipeline.findIndex((item) => item.handler === handler)

        if (index > -1) {
          stage = 'dataPipeline'

          if (skipStage) {
            if (index === this.dataPipeline.length - 1) {
              stage = 'display'
            } else {
              index++
            }
          }
        } else {
          index = this.displayPipeline.findIndex((item) => item.handler === handler)

          if (index > -1) {
            stage = 'displayPipeline'

            if (skipStage) {
              if (index === this.displayPipeline.length - 1) {
                stage = 'end'
              } else {
                index++
              }
            }
          } else {
            console.error('Unable to refresh data, invalid handler provided', handler)
            return
          }
        }
      } else {
        stage = handler || 'all'
        index = 0
      }

      if (this.redrawBlock) {
        if (
          !this.redrawBlockRestoreConfig ||
          (this.redrawBlockRestoreConfig &&
            ((this.redrawBlockRestoreConfig.stage === stage && index < this.redrawBlockRestoreConfig.index) ||
              cascadeOrder.indexOf(stage) < cascadeOrder.indexOf(this.redrawBlockRestoreConfig.stage)))
        ) {
          this.redrawBlockRestoreConfig = {
            handler,
            skipStage,
            renderInPosition,
            stage,
            index
          }
        }
      } else {
        if (Helpers.elVisible(this.element)) {
          if (renderInPosition) {
            this.reRenderInPosition(this.refreshPipelines.bind(this, handler, stage, index, renderInPosition))
          } else {
            this.refreshPipelines(handler, stage, index, renderInPosition)

            if (!handler) {
              this.table.columnManager.renderer.renderColumns()
            }

            this.renderTable()

            if (table.options.layoutColumnsOnNewData) {
              this.table.columnManager.redraw(true)
            }
          }
        } else {
          this.refreshPipelines(handler, stage, index, renderInPosition)
        }

        this.dispatch('data-refreshed')
      }
    }
  }

  /**
   * Execute data and display refresh pipelines.
   * @param {Function|string|false} [handler] Handler or stage to start from.
   * @param {string} stage Refresh stage.
   * @param {number} index Pipeline index.
   * @param {boolean} renderInPosition Preserve viewport position.
   */
  refreshPipelines(handler, stage, index, renderInPosition) {
    this.dispatch('data-refreshing')

    if (!handler || !this.activeRowsPipeline[0]) {
      this.activeRowsPipeline[0] = this.rows.slice(0)
    }

    // cascade through data refresh stages
    switch (stage) {
      case 'all':
      // handle case where all data needs refreshing
      // falls through

      case 'dataPipeline':
        for (let i = index; i < this.dataPipeline.length; i++) {
          const result = this.dataPipeline[i].handler(this.activeRowsPipeline[i].slice(0))

          this.activeRowsPipeline[i + 1] = result || this.activeRowsPipeline[i].slice(0)
        }

        this.setActiveRows(this.activeRowsPipeline[this.dataPipeline.length])
      // falls through

      case 'display':
        index = 0
        this.resetDisplayRows()
      // falls through

      case 'displayPipeline':
        for (let i = index; i < this.displayPipeline.length; i++) {
          const result = this.displayPipeline[i].handler(
            (i ? this.getDisplayRows(i - 1) : this.activeRows).slice(0),
            renderInPosition
          )

          this.setDisplayRows(result || this.getDisplayRows(i - 1).slice(0), i)
        }
      // falls through

      case 'end':
        // case to handle scenario when trying to skip past end stage
        this.regenerateRowPositions()
    }

    if (this.getDisplayRows().length) {
      this._clearPlaceholder()
    }
  }

  // regenerate row positions
  /**
   * Regenerate display position numbers for data rows.
   */
  regenerateRowPositions() {
    const rows = this.getDisplayRows()
    let index = 1

    rows.forEach((row) => {
      if (row.type === 'row') {
        row.setPosition(index)
        index++
      }
    })
  }

  /**
   * Set active row set and cache count.
   * @param {Array<object>} activeRows Active rows.
   */
  setActiveRows(activeRows) {
    this.activeRows = [...activeRows]
    this.activeRowsCount = this.activeRows.length
  }

  // reset display rows array
  /**
   * Reset display rows from active rows.
   */
  resetDisplayRows() {
    this.displayRows = []

    this.displayRows.push(this.activeRows.slice(0))

    this.displayRowsCount = this.displayRows[0].length
  }

  // set display row pipeline data
  /**
   * Store display rows for a pipeline stage.
   * @param {Array<object>} displayRows Display rows.
   * @param {number} index Pipeline stage index.
   */
  setDisplayRows(displayRows, index) {
    this.displayRows[index] = displayRows

    if (index === this.displayRows.length - 1) {
      this.displayRowsCount = this.displayRows[this.displayRows.length - 1].length
    }
  }

  /**
   * Get display rows for final or specific pipeline stage.
   * @param {number} [index] Pipeline stage index.
   * @returns {Array<object>}
   */
  getDisplayRows(index) {
    if (index === undefined) {
      return this.displayRows.length ? this.displayRows[this.displayRows.length - 1] : []
    } else {
      return this.displayRows[index] || []
    }
  }

  /**
   * Get currently visible rows from renderer.
   * @param {boolean} chain Apply rows-visible extension chain.
   * @param {boolean} viewable Request only viewable rows.
   * @returns {Array<object>}
   */
  getVisibleRows(chain, viewable) {
    let rows = [...this.renderer.visibleRows(!viewable)]

    if (chain) {
      rows = this.chain('rows-visible', [viewable], rows, rows)
    }

    return rows
  }

  // repeat action across display rows
  /**
   * Execute a callback across pipeline row arrays.
   * @param {Function} callback Iterator callback.
   */
  displayRowIterator(callback) {
    this.activeRowsPipeline.forEach(callback)
    this.displayRows.forEach(callback)

    this.displayRowsCount = this.displayRows[this.displayRows.length - 1].length
  }

  // return only actual rows (not group headers etc)
  /**
   * Get rows by type.
   * @param {string|boolean} [type] Row set type.
   * @returns {Array<object>}
   */
  getRows(type) {
    let rows

    switch (type) {
      case 'active':
        rows = this.activeRows
        break

      case 'display':
        rows = this.table.rowManager.getDisplayRows()
        break

      case 'visible':
        rows = this.getVisibleRows(false, true)
        break

      default:
        rows = this.chain('rows-retrieve', type, null, this.rows) || this.rows
    }

    return rows
  }

  /// ////////////// Table Rendering /////////////////
  // trigger rerender of table in current position
  /**
   * Re-render rows while preserving current viewport position.
   * @param {Function} [callback] Optional callback during re-render.
   */
  reRenderInPosition(callback) {
    if (this.redrawBlock) {
      if (callback) {
        callback()
      } else {
        this.redrawBlockRenderInPosition = true
      }
    } else {
      this.dispatchExternal('renderStarted')

      this.renderer.rerenderRows(callback)

      if (!this.fixedHeight) {
        this.adjustTableSize()
      }

      this.scrollBarCheck()

      this.dispatchExternal('renderComplete')
    }
  }

  /**
   * Measure and publish vertical scrollbar width changes.
   */
  scrollBarCheck() {
    let scrollbarWidth = 0

    // adjust for vertical scrollbar moving table when present
    if (this.element.scrollHeight > this.element.clientHeight) {
      scrollbarWidth = this.element.offsetWidth - this.element.clientWidth
    }

    if (scrollbarWidth !== this.scrollbarWidth) {
      this.scrollbarWidth = scrollbarWidth
      this.dispatch('scrollbar-vertical', scrollbarWidth)
    }
  }

  /**
   * Initialize vertical renderer implementation.
   */
  initializeRenderer() {
    let renderClass

    const renderers = {
      virtual: RendererVirtualDomVertical,
      basic: RendererBasicVertical
    }

    if (typeof this.table.options.renderVertical === 'string') {
      renderClass = renderers[this.table.options.renderVertical]
    } else {
      renderClass = this.table.options.renderVertical
    }

    if (renderClass) {
      this.renderMode = this.table.options.renderVertical

      this.renderer = new renderClass(this.table, this.element, this.tableElement)
      this.renderer.initialize()

      if (
        (this.table.element.clientHeight || this.table.options.height) &&
        !(this.table.options.minHeight && this.table.options.maxHeight)
      ) {
        this.fixedHeight = true
      } else {
        this.fixedHeight = false
      }
    } else {
      console.error('Unable to find matching renderer:', this.table.options.renderVertical)
    }
  }

  /**
   * Get current render mode.
   * @returns {string}
   */
  getRenderMode() {
    return this.renderMode
  }

  /**
   * Render table rows and placeholder state.
   */
  renderTable() {
    this.dispatchExternal('renderStarted')

    this.element.scrollTop = 0

    this._clearTable()

    if (this.displayRowsCount) {
      this.renderer.renderRows()

      if (this.firstRender) {
        this.firstRender = false

        if (!this.fixedHeight) {
          this.adjustTableSize()
        }

        this.layoutRefresh(true)
      }
    } else {
      this.renderEmptyScroll()
    }

    if (!this.fixedHeight) {
      this.adjustTableSize()
    }

    this.dispatch('table-layout')

    if (!this.displayRowsCount) {
      this._showPlaceholder()
    }

    this.scrollBarCheck()

    this.dispatchExternal('renderComplete')
  }

  // show scrollbars on empty table div
  /**
   * Render empty-state table shell when no display rows exist.
   */
  renderEmptyScroll() {
    if (this.placeholder) {
      this.tableElement.style.display = 'none'
    } else {
      this.tableElement.style.minWidth = this.table.columnManager.getWidth() + 'px'
      // this.tableElement.style.minHeight = "1px";
      // this.tableElement.style.visibility = "hidden";
    }
  }

  /**
   * Clear table rows and reset scroll cache.
   */
  _clearTable() {
    this._clearPlaceholder()

    this.scrollTop = 0
    this.scrollLeft = 0

    this.renderer.clearRows()
  }

  /**
   * Render empty table state and placeholder.
   */
  tableEmpty() {
    this.renderEmptyScroll()
    this._showPlaceholder()
  }

  /**
   * Ensure placeholder visibility matches current display rows.
   */
  checkPlaceholder() {
    if (this.displayRowsCount) {
      this._clearPlaceholder()
    } else {
      this.tableEmpty()
    }
  }

  /**
   * Show placeholder element.
   */
  _showPlaceholder() {
    if (this.placeholder) {
      if (this.placeholder && this.placeholder.parentNode) {
        this.placeholder.parentNode.removeChild(this.placeholder)
      }

      this.initializePlaceholder()

      this.placeholder.setAttribute('tabulator-render-mode', this.renderMode)

      this.getElement().appendChild(this.placeholder)
      this._positionPlaceholder()

      this.adjustTableSize()
    }
  }

  /**
   * Remove placeholder element and clear empty-state styles.
   */
  _clearPlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder)
    }

    // clear empty table placeholder min
    this.tableElement.style.minWidth = ''
    this.tableElement.style.display = ''
  }

  /**
   * Position placeholder content to match table width and scroll offset.
   */
  _positionPlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.style.width = `${this.table.columnManager.getWidth()}px`
      this.placeholderContents.style.width = `${this.table.rowManager.element.clientWidth}px`
      this.placeholderContents.style.marginLeft = `${this.scrollLeft}px`
    }
  }

  /**
   * Apply odd/even styling classes to a row.
   * @param {Row} row Row instance.
   * @param {number} index Row index.
   */
  styleRow(row, index) {
    const rowEl = row.getElement()

    const isEven = Boolean(index % 2)
    rowEl.classList.toggle('tabulator-row-even', isEven)
    rowEl.classList.toggle('tabulator-row-odd', !isEven)
  }

  // normalize height of active rows
  /**
   * Normalize heights for active rows.
   * @param {boolean} force Force normalization.
   */
  normalizeHeight(force) {
    this.activeRows.forEach((row) => {
      row.normalizeHeight(force)
    })
  }

  // adjust the height of the table holder to fit in the Tabulator element
  /**
   * Adjust table holder size to available layout space.
   * @returns {boolean} True if table holder height changed.
   */
  adjustTableSize() {
    const initialHeight = this.element.clientHeight
    let minHeight
    let resized = false

    if (this.renderer.verticalFillMode === 'fill') {
      const otherHeight = Math.floor(
        this.table.columnManager.getElement().getBoundingClientRect().height +
          (this.table.footerManager && this.table.footerManager.active && !this.table.footerManager.external
            ? this.table.footerManager.getElement().getBoundingClientRect().height
            : 0)
      )

      if (this.fixedHeight) {
        minHeight = Number.isNaN(Number(this.table.options.minHeight))
          ? this.table.options.minHeight
          : `${this.table.options.minHeight}px`

        const height = `calc(100% - ${otherHeight}px)`
        this.element.style.minHeight = minHeight || `calc(100% - ${otherHeight}px)`
        this.element.style.height = height
        this.element.style.maxHeight = height
      } else {
        this.element.style.height = ''
        this.element.style.height = `${this.table.element.clientHeight - otherHeight}px`
        this.element.scrollTop = this.scrollTop
      }

      this.renderer.resize()

      // check if the table has changed size when dealing with variable height tables
      if (!this.fixedHeight && initialHeight !== this.element.clientHeight) {
        resized = true
        if (!this.redrawing) {
          // prevent recursive redraws
          this.redrawing = true
          if (this.subscribed('table-resize')) {
            this.dispatch('table-resize')
          } else {
            this.redraw()
          }
          this.redrawing = false
        }
      }

      this.scrollBarCheck()
    }

    this._positionPlaceholder()
    return resized
  }

  // reinitialize all rows
  /**
   * Reinitialize all tracked rows.
   */
  reinitialize() {
    this.rows.forEach((row) => {
      row.reinitialize(true)
    })
  }

  // prevent table from being redrawn
  /**
   * Block table redraw operations.
   */
  blockRedraw() {
    this.redrawBlock = true
    this.redrawBlockRestoreConfig = false
  }

  // restore table redrawing
  /**
   * Restore redraw operations and run deferred refresh work.
   */
  restoreRedraw() {
    this.redrawBlock = false

    if (this.redrawBlockRestoreConfig) {
      this.refreshActiveData(
        this.redrawBlockRestoreConfig.handler,
        this.redrawBlockRestoreConfig.skipStage,
        this.redrawBlockRestoreConfig.renderInPosition
      )

      this.redrawBlockRestoreConfig = false
    } else {
      if (this.redrawBlockRenderInPosition) {
        this.reRenderInPosition()
      }
    }

    this.redrawBlockRenderInPosition = false
  }

  // redraw table
  /**
   * Redraw table and optionally force full render.
   * @param {boolean} force Force full table render.
   */
  redraw(force) {
    this.adjustTableSize()
    this.table.tableWidth = this.table.element.clientWidth

    if (!force) {
      this.reRenderInPosition()
      this.scrollHorizontal(this.scrollLeft)
    } else {
      this.renderTable()
    }
  }

  /**
   * Reset table scroll position and emit scroll event.
   */
  resetScroll() {
    this.element.scrollLeft = 0
    this.element.scrollTop = 0

    if (this.table.browser === 'ie') {
      const event = document.createEvent('Event')
      event.initEvent('scroll', false, true)
      this.element.dispatchEvent(event)
    } else {
      this.element.dispatchEvent(new Event('scroll'))
    }
  }
}
