import Module from '../../core/Module.js'
import Range from './Range.js'
import extensions from './extensions/extensions.js'

const RANGE_OVERLAY_HIDDEN_CLASS = 'tabulator-range-overlay-hidden'

export default class SelectRange extends Module {
  static moduleName = 'selectRange'
  static moduleInitOrder = 1
  static moduleExtensions = extensions

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.selecting = 'cell'
    this.mousedown = false
    this.ranges = []
    this.overlay = null
    this.rowHeader = null
    this.layoutChangeTimeout = null
    this.columnSelection = false
    this.rowSelection = false
    this.maxRanges = 0
    this.activeRange = false
    this.blockKeydown = false

    this.keyDownEvent = this._handleKeyDown.bind(this)
    this.mouseUpEvent = this._handleMouseUp.bind(this)

    this.registerTableOption('selectableRange', false) // enable selectable range
    this.registerTableOption('selectableRangeColumns', false) // enable selectable range
    this.registerTableOption('selectableRangeRows', false) // enable selectable range
    this.registerTableOption('selectableRangeClearCells', false) // allow clearing of active range
    this.registerTableOption('selectableRangeClearCellsValue', undefined) // value for cleared active range
    this.registerTableOption('selectableRangeAutoFocus', true) // focus on a cell after resetRanges

    this.registerTableFunction('getRangesData', this.getRangesData.bind(this))
    this.registerTableFunction('getRanges', this.getRanges.bind(this))
    this.registerTableFunction('addRange', this.addRangeFromComponent.bind(this))

    this.registerComponentFunction('cell', 'getRanges', this.cellGetRanges.bind(this))
    this.registerComponentFunction('row', 'getRanges', this.rowGetRanges.bind(this))
    this.registerComponentFunction('column', 'getRanges', this.colGetRanges.bind(this))
  }

  /// ////////////////////////////////
  /// ////    Initialization   ///////
  /// ////////////////////////////////

  /**
   * Initialize selectable range behavior.
   */
  initialize() {
    if (this.options('selectableRange')) {
      const columns = this.options('columns')

      if (!this.options('selectableRows')) {
        this.maxRanges = this.options('selectableRange')

        this.initializeTable()
        this.initializeWatchers()
      } else {
        console.warn('SelectRange functionality cannot be used in conjunction with row selection')
      }

      if (columns.findIndex((column) => column.frozen) > 0) {
        console.warn(
          'Having frozen column in arbitrary position with selectRange option may result in unpredictable behavior.'
        )
      }

      if (columns.filter((column) => column.frozen).length > 1) {
        console.warn('Having multiple frozen columns with selectRange option may result in unpredictable behavior.')
      }
    }
  }

  /**
   * Build range overlay and base table wiring.
   */
  initializeTable() {
    this.overlay = document.createElement('div')
    this.overlay.classList.add('tabulator-range-overlay', RANGE_OVERLAY_HIDDEN_CLASS)

    this.rangeContainer = document.createElement('div')
    this.rangeContainer.classList.add('tabulator-range-container')

    this.activeRangeCellElement = document.createElement('div')
    this.activeRangeCellElement.classList.add('tabulator-range-cell-active')

    this.overlay.appendChild(this.rangeContainer)
    this.overlay.appendChild(this.activeRangeCellElement)

    this.table.rowManager.element.addEventListener('keydown', this.keyDownEvent)

    this.resetRanges()

    this.table.rowManager.element.appendChild(this.overlay)
    this.table.columnManager.element.setAttribute('tabindex', 0)
    this.table.element.classList.add('tabulator-ranges')
  }

  /**
   * Subscribe range module event watchers.
   */
  initializeWatchers() {
    this.columnSelection = this.options('selectableRangeColumns')
    this.rowSelection = this.options('selectableRangeRows')

    this.subscribe('column-init', this.initializeColumn.bind(this))
    this.subscribe('column-mousedown', this.handleColumnMouseDown.bind(this))
    this.subscribe('column-mousemove', this.handleColumnMouseMove.bind(this))
    this.subscribe('column-resized', this.handleColumnResized.bind(this))
    this.subscribe('column-moving', this.handleColumnMoving.bind(this))
    this.subscribe('column-moved', this.handleColumnMoved.bind(this))
    this.subscribe('column-width', this.layoutChange.bind(this))
    this.subscribe('column-height', this.layoutChange.bind(this))
    this.subscribe('column-resized', this.layoutChange.bind(this))
    this.subscribe('columns-loaded', this.updateHeaderColumn.bind(this))

    this.subscribe('cell-height', this.layoutChange.bind(this))
    this.subscribe('cell-rendered', this.renderCell.bind(this))
    this.subscribe('cell-mousedown', this.handleCellMouseDown.bind(this))
    this.subscribe('cell-mousemove', this.handleCellMouseMove.bind(this))
    this.subscribe('cell-click', this.handleCellClick.bind(this))
    this.subscribe('cell-editing', this.handleEditingCell.bind(this))

    this.subscribe('page-changed', this.redraw.bind(this))

    this.subscribe('scroll-vertical', this.layoutChange.bind(this))
    this.subscribe('scroll-horizontal', this.layoutChange.bind(this))

    this.subscribe('data-destroy', this.tableDestroyed.bind(this))
    this.subscribe('data-processed', this.resetRanges.bind(this))

    this.subscribe('table-layout', this.layoutElement.bind(this))
    this.subscribe('table-redraw', this.redraw.bind(this))
    this.subscribe('table-destroy', this.tableDestroyed.bind(this))

    this.subscribe('edit-editor-clear', this.finishEditingCell.bind(this))
    this.subscribe('edit-blur', this.restoreFocus.bind(this))

    this.subscribe('keybinding-nav-prev', this.keyNavigate.bind(this, 'left'))
    this.subscribe('keybinding-nav-next', this.keyNavigate.bind(this, 'right'))
    this.subscribe('keybinding-nav-left', this.keyNavigate.bind(this, 'left'))
    this.subscribe('keybinding-nav-right', this.keyNavigate.bind(this, 'right'))
    this.subscribe('keybinding-nav-up', this.keyNavigate.bind(this, 'up'))
    this.subscribe('keybinding-nav-down', this.keyNavigate.bind(this, 'down'))
    this.subscribe('keybinding-nav-range', this.keyNavigateRange.bind(this))
  }

  /**
   * Initialize column-specific range warnings/settings.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    if (this.columnSelection && column.definition.headerSort && this.options('headerSortClickElement') !== 'icon') {
      console.warn(
        "Using column headerSort with selectableRangeColumns option may result in unpredictable behavior. Consider using headerSortClickElement: 'icon'."
      )
    }

    if (column.modules.edit) {
      // Block editor from taking action so we can trigger edit by
      // double clicking.
      // column.modules.edit.blocked = true;
    }
  }

  /**
   * Resolve row-header column and validate frozen configuration.
   */
  updateHeaderColumn() {
    let frozenCols

    if (this.rowSelection) {
      this.rowHeader = this.table.columnManager.getVisibleColumnsByIndex()[0]

      if (this.rowHeader) {
        this.rowHeader.definition.cssClass = [this.rowHeader.definition.cssClass, 'tabulator-range-row-header']
          .filter(Boolean)
          .join(' ')

        if (this.rowHeader.definition.headerSort) {
          console.warn('Using column headerSort with selectableRangeRows option may result in unpredictable behavior')
        }

        if (this.rowHeader.definition.editor) {
          console.warn('Using column editor with selectableRangeRows option may result in unpredictable behavior')
        }
      }
    }

    // warn if invalid frozen column configuration detected
    if (this.table.modules.frozenColumns && this.table.modules.frozenColumns.active) {
      frozenCols = this.table.modules.frozenColumns.getFrozenColumns()

      if (frozenCols.length > 1 || (frozenCols.length === 1 && frozenCols[0] !== this.rowHeader)) {
        console.warn(
          'Using frozen columns that are not the range header in combination with the selectRange option may result in unpredictable behavior'
        )
      }
    }
  }

  /// ////////////////////////////////
  /// ////   Table Functions   ///////
  /// ////////////////////////////////

  /**
   * Get all range components.
   * @returns {Array<object>}
   */
  getRanges() {
    return this.ranges.map((range) => range.getComponent())
  }

  /**
   * Get data payload for all ranges.
   * @returns {Array<*>}
   */
  getRangesData() {
    return this.ranges.map((range) => range.getData())
  }

  /**
   * Add a range from cell components.
   * @param {object} [start] Start cell component.
   * @param {object} [end] End cell component.
   * @returns {Range}
   */
  addRangeFromComponent(start, end) {
    start = start ? start._cell : null
    end = end ? end._cell : null

    return this.addRange(start, end)
  }

  /// ////////////////////////////////
  /// //// Component Functions ///////
  /// ////////////////////////////////

  /**
   * Get ranges occupying a cell.
   * @param {object} cell Internal cell.
   * @returns {Array<object>}
   */
  cellGetRanges(cell) {
    const ranges =
      cell.column === this.rowHeader
        ? this.ranges.filter((range) => range.occupiesRow(cell.row))
        : this.ranges.filter((range) => range.occupies(cell))

    return ranges.map((range) => range.getComponent())
  }

  /**
   * Get ranges occupying a row.
   * @param {object} row Internal row.
   * @returns {Array<object>}
   */
  rowGetRanges(row) {
    const ranges = this.ranges.filter((range) => range.occupiesRow(row))

    return ranges.map((range) => range.getComponent())
  }

  /**
   * Get ranges occupying a column.
   * @param {object} col Internal column.
   * @returns {Array<object>}
   */
  colGetRanges(col) {
    const ranges = this.ranges.filter((range) => range.occupiesColumn(col))

    return ranges.map((range) => range.getComponent())
  }

  /// ////////////////////////////////
  /// /////// Event Handlers /////////
  /// ////////////////////////////////

  /**
   * Handle global mouseup for drag selection.
   */
  _handleMouseUp() {
    this.mousedown = false
    document.removeEventListener('mouseup', this.mouseUpEvent)
  }

  /**
   * Handle keyboard actions for range editing and clearing.
   * @param {KeyboardEvent} e Keyboard event.
   */
  _handleKeyDown(e) {
    const editModule = this.table.modules.edit

    if (this.blockKeydown || (editModule && editModule.currentCell)) {
      return
    }

    if (e.key === 'Enter') {
      if (editModule) {
        editModule.editCell(this.getActiveCell())
      }

      e.preventDefault()
      return
    }

    if (
      (e.key === 'Backspace' || e.key === 'Delete') &&
      this.options('selectableRangeClearCells') &&
      this.activeRange
    ) {
      this.activeRange.clearValues()
    }
  }

  /**
   * Initialize text focus/selection for a cell.
   * @param {object} cell Internal cell.
   */
  initializeFocus(cell) {
    let range

    this.restoreFocus()

    try {
      if (window.getSelection) {
        range = document.createRange()
        range.selectNode(cell.getElement())
        window.getSelection().removeAllRanges()
        window.getSelection().addRange(range)
      }
    } catch {
      return
    }
  }

  /**
   * Restore focus to the row manager element.
   * @returns {boolean}
   */
  restoreFocus() {
    this.table.rowManager.element.focus()

    return true
  }

  /// ////////////////////////////////
  /// /// Column Functionality ///////
  /// ////////////////////////////////

  /**
   * Resize selected columns after a column resize.
   * @param {object} column Internal column.
   */
  handleColumnResized(column) {
    let selected

    if (this.selecting !== 'column' && this.selecting !== 'all') {
      return
    }

    selected = this.ranges.some((range) => range.occupiesColumn(column))

    if (!selected) {
      return
    }

    this.ranges.forEach((range) => {
      const selectedColumns = range.getColumns(true)

      selectedColumns.forEach((selectedColumn) => {
        if (selectedColumn !== column) {
          selectedColumn.setWidth(column.width)
        }
      })
    })
  }

  /**
   * Start column move handling while maintaining range state.
   * @param {object} column Internal column.
   */
  handleColumnMoving(column) {
    this.resetRanges().setBounds(column)
    this.setOverlayVisible(false)
  }

  /**
   * Finalize column move range bounds.
   * @param {object} from Source column after move.
   */
  handleColumnMoved(from) {
    this.activeRange.setBounds(from)
    this.layoutElement()
  }

  /**
   * Handle mousedown on column headers for range selection.
   * @param {MouseEvent} event Mouse event.
   * @param {object} column Internal column.
   */
  handleColumnMouseDown(event, column) {
    if (
      event.button === 2 &&
      (this.selecting === 'column' || this.selecting === 'all') &&
      this.activeRange.occupiesColumn(column)
    ) {
      return
    }

    // If columns are movable, allow dragging columns only if they are not
    // selected. Dragging selected columns should move the columns instead.
    if (this.table.options.movableColumns && this.selecting === 'column' && this.activeRange.occupiesColumn(column)) {
      return
    }

    this.mousedown = true

    document.addEventListener('mouseup', this.mouseUpEvent)

    this.newSelection(event, column)
  }

  /**
   * Handle hover drag extension for column selections.
   * @param {MouseEvent} e Mouse event.
   * @param {object} column Internal column.
   */
  handleColumnMouseMove(e, column) {
    if (column === this.rowHeader || !this.mousedown || this.selecting === 'all') {
      return
    }

    this.activeRange.setBounds(false, column, true)
  }

  /// ////////////////////////////////
  /// ///// Cell Functionality ///////
  /// ////////////////////////////////

  /**
   * Render range CSS classes for a cell.
   * @param {object} cell Internal cell.
   */
  renderCell(cell) {
    const el = cell.getElement()
    const rangeIdx = this.ranges.findIndex((range) => range.occupies(cell))

    el.classList.toggle('tabulator-range-selected', rangeIdx !== -1)
    el.classList.toggle(
      'tabulator-range-only-cell-selected',
      this.ranges.length === 1 && this.ranges[0].atTopLeft(cell) && this.ranges[0].atBottomRight(cell)
    )

    el.dataset.range = rangeIdx
  }

  /**
   * Handle mousedown on cells for range selection.
   * @param {MouseEvent} event Mouse event.
   * @param {object} cell Internal cell.
   */
  handleCellMouseDown(event, cell) {
    if (
      event.button === 2 &&
      (this.activeRange.occupies(cell) ||
        ((this.selecting === 'row' || this.selecting === 'all') && this.activeRange.occupiesRow(cell.row)))
    ) {
      return
    }

    this.mousedown = true

    document.addEventListener('mouseup', this.mouseUpEvent)

    this.newSelection(event, cell)
  }

  /**
   * Handle drag-extension when moving across cells.
   * @param {MouseEvent} e Mouse event.
   * @param {object} cell Internal cell.
   */
  handleCellMouseMove(e, cell) {
    if (!this.mousedown || this.selecting === 'all') {
      return
    }

    this.activeRange.setBounds(false, cell, true)
  }

  /**
   * Handle cell click focus behavior.
   * @param {MouseEvent} _e Mouse event.
   * @param {object} cell Internal cell.
   */
  handleCellClick(_e, cell) {
    this.initializeFocus(cell)
  }

  /**
   * Keep active range aligned with currently edited cell.
   * @param {object} cell Internal cell.
   */
  handleEditingCell(cell) {
    if (this.activeRange) {
      this.activeRange.setBounds(cell)
    }
  }

  /**
   * Restore keydown behavior after edit completion.
   */
  finishEditingCell() {
    this.blockKeydown = true
    this.table.rowManager.element.focus()

    setTimeout(() => {
      this.blockKeydown = false
    }, 10)
  }

  /// ////////////////////////////////
  /// ////     Navigation      ///////
  /// ////////////////////////////////

  /**
   * Navigate active range by one cell.
   * @param {string} dir Direction.
   * @param {KeyboardEvent} e Keyboard event.
   */
  keyNavigate(dir, e) {
    if (this.navigate(false, false, dir)) {
      e.preventDefault()
    }
  }

  /**
   * Navigate or expand active range via keybinding.
   * @param {KeyboardEvent} e Keyboard event.
   * @param {string} dir Direction.
   * @param {boolean} jump Jump to edge.
   * @param {boolean} expand Expand range.
   */
  keyNavigateRange(e, dir, jump, expand) {
    if (this.navigate(jump, expand, dir)) {
      e.preventDefault()
    }
  }

  /**
   * Execute navigation logic for current active range.
   * @param {boolean} jump Jump to populated edge.
   * @param {boolean} expand Expand range.
   * @param {string} dir Direction.
   * @returns {boolean}
   */
  navigate(jump, expand, dir) {
    let moved
    let range
    let rangeEdge
    let prevRect
    let nextRow
    let nextCol
    let row
    let column
    let rowRect
    let rowManagerRect
    let columnRect
    let columnManagerRect

    // Don't navigate while editing
    if (this.table.modules.edit && this.table.modules.edit.currentCell) {
      return false
    }

    // If there are more than 1 range, use the active range and destroy the others
    if (this.ranges.length > 1) {
      this.ranges = this.ranges.filter((range) => {
        if (range === this.activeRange) {
          range.setEnd(range.start.row, range.start.col)
          return true
        }
        range.destroy()
        return false
      })
    }

    range = this.activeRange
    prevRect = {
      top: range.top,
      bottom: range.bottom,
      left: range.left,
      right: range.right
    }

    rangeEdge = expand ? range.end : range.start
    nextRow = rangeEdge.row
    nextCol = rangeEdge.col

    if (jump) {
      switch (dir) {
        case 'left':
          nextCol = this.findJumpCellLeft(range.start.row, rangeEdge.col)
          break
        case 'right':
          nextCol = this.findJumpCellRight(range.start.row, rangeEdge.col)
          break
        case 'up':
          nextRow = this.findJumpCellUp(rangeEdge.row, range.start.col)
          break
        case 'down':
          nextRow = this.findJumpCellDown(rangeEdge.row, range.start.col)
          break
      }
    } else {
      if (expand) {
        if (
          (this.selecting === 'row' && (dir === 'left' || dir === 'right')) ||
          (this.selecting === 'column' && (dir === 'up' || dir === 'down'))
        ) {
          return false
        }
      }

      switch (dir) {
        case 'left':
          nextCol = Math.max(nextCol - 1, 0)
          break
        case 'right':
          nextCol = Math.min(nextCol + 1, this.getTableColumns().length - 1)
          break
        case 'up':
          nextRow = Math.max(nextRow - 1, 0)
          break
        case 'down':
          nextRow = Math.min(nextRow + 1, this.getTableRows().length - 1)
          break
      }
    }

    if (this.rowHeader && nextCol === 0) {
      nextCol = 1
    }

    if (!expand) {
      range.setStart(nextRow, nextCol)
    }

    range.setEnd(nextRow, nextCol)

    if (!expand) {
      this.selecting = 'cell'
    }

    moved =
      prevRect.top !== range.top ||
      prevRect.bottom !== range.bottom ||
      prevRect.left !== range.left ||
      prevRect.right !== range.right

    if (moved) {
      row = this.getRowByRangePos(range.end.row)
      column = this.getColumnByRangePos(range.end.col)
      rowRect = row.getElement().getBoundingClientRect()
      columnRect = column.getElement().getBoundingClientRect()
      rowManagerRect = this.table.rowManager.getElement().getBoundingClientRect()
      columnManagerRect = this.table.columnManager.getElement().getBoundingClientRect()

      if (!(rowRect.top >= rowManagerRect.top && rowRect.bottom <= rowManagerRect.bottom)) {
        if (row.getElement().parentNode && column.getElement().parentNode) {
          // Use faster autoScroll when the elements are on the DOM
          this.autoScroll(range, row.getElement(), column.getElement())
        } else {
          row.getComponent().scrollTo(undefined, false)
        }
      }

      if (
        !(
          columnRect.left >= columnManagerRect.left + this.getRowHeaderWidth() &&
          columnRect.right <= columnManagerRect.right
        )
      ) {
        if (row.getElement().parentNode && column.getElement().parentNode) {
          // Use faster autoScroll when the elements are on the DOM
          this.autoScroll(range, row.getElement(), column.getElement())
        } else {
          column.getComponent().scrollTo(undefined, false)
        }
      }

      this.layoutElement()
    }
    return true
  }

  /**
   * Handle removal of a range.
   * @param {*} removed - Parameter value.
   */
  rangeRemoved(removed) {
    this.ranges = this.ranges.filter((range) => range !== removed)

    if (this.activeRange === removed) {
      if (this.ranges.length) {
        this.activeRange = this.ranges[this.ranges.length - 1]
      } else {
        this.addRange()
      }
    }

    this.layoutElement(true)
  }

  /**
   * Find the next jump row index.
   * @param {*} column - Parameter value.
   * @param {*} rows - Parameter value.
   * @param {*} reverse - Parameter value.
   * @param {*} emptyStart - Parameter value.
   * @param {*} emptySide - Parameter value.
   * @returns {*} Return value.
   */
  findJumpRow(column, rows, reverse, emptyStart, emptySide) {
    const targetRows = reverse ? [...rows].reverse() : rows

    return this.findJumpItem(emptyStart, emptySide, targetRows, (row) => row.getData()[column.getField()])
  }

  /**
   * Find the next jump column index.
   * @param {*} row - Parameter value.
   * @param {*} columns - Parameter value.
   * @param {*} reverse - Parameter value.
   * @param {*} emptyStart - Parameter value.
   * @param {*} emptySide - Parameter value.
   * @returns {*} Return value.
   */
  findJumpCol(row, columns, reverse, emptyStart, emptySide) {
    const targetColumns = reverse ? [...columns].reverse() : columns

    return this.findJumpItem(emptyStart, emptySide, targetColumns, (column) => row.getData()[column.getField()])
  }

  /**
   * Find a jump position in a value sequence.
   * @param {*} emptyStart - Parameter value.
   * @param {*} emptySide - Parameter value.
   * @param {*} items - Parameter value.
   * @param {*} valueResolver - Parameter value.
   * @returns {*} Return value.
   */
  findJumpItem(emptyStart, emptySide, items, valueResolver) {
    let nextItem

    for (const currentItem of items) {
      const currentValue = valueResolver(currentItem)

      if (emptyStart) {
        nextItem = currentItem
        if (currentValue) {
          break
        }
      } else {
        if (emptySide) {
          nextItem = currentItem

          if (currentValue) {
            break
          }
        } else {
          if (currentValue) {
            nextItem = currentItem
          } else {
            break
          }
        }
      }
    }

    return nextItem
  }

  /**
   * Find the jump target to the left.
   * @param {*} rowPos - Parameter value.
   * @param {*} colPos - Parameter value.
   * @returns {*} Return value.
   */
  findJumpCellLeft(rowPos, colPos) {
    const row = this.getRowByRangePos(rowPos)
    const columns = this.getTableColumns()
    const isStartingCellEmpty = this.isEmpty(row.getData()[columns[colPos].getField()])
    const isLeftOfStartingCellEmpty = columns[colPos - 1]
      ? this.isEmpty(row.getData()[columns[colPos - 1].getField()])
      : false
    const targetCols = this.rowHeader ? columns.slice(1, colPos) : columns.slice(0, colPos)
    const jumpCol = this.findJumpCol(row, targetCols, true, isStartingCellEmpty, isLeftOfStartingCellEmpty)

    if (jumpCol) {
      return jumpCol.getPosition() - 1
    }

    return colPos
  }

  /**
   * Find the jump target to the right.
   * @param {*} rowPos - Parameter value.
   * @param {*} colPos - Parameter value.
   * @returns {*} Return value.
   */
  findJumpCellRight(rowPos, colPos) {
    const row = this.getRowByRangePos(rowPos)
    const columns = this.getTableColumns()
    const isStartingCellEmpty = this.isEmpty(row.getData()[columns[colPos].getField()])
    const isRightOfStartingCellEmpty = columns[colPos + 1]
      ? this.isEmpty(row.getData()[columns[colPos + 1].getField()])
      : false
    const jumpCol = this.findJumpCol(
      row,
      columns.slice(colPos + 1, columns.length),
      false,
      isStartingCellEmpty,
      isRightOfStartingCellEmpty
    )

    if (jumpCol) {
      return jumpCol.getPosition() - 1
    }

    return colPos
  }

  /**
   * Find the jump target upward.
   * @param {*} rowPos - Parameter value.
   * @param {*} colPos - Parameter value.
   * @returns {*} Return value.
   */
  findJumpCellUp(rowPos, colPos) {
    const column = this.getColumnByRangePos(colPos)
    const rows = this.getTableRows()
    const isStartingCellEmpty = this.isEmpty(rows[rowPos].getData()[column.getField()])
    const isTopOfStartingCellEmpty = rows[rowPos - 1]
      ? this.isEmpty(rows[rowPos - 1].getData()[column.getField()])
      : false
    const jumpRow = this.findJumpRow(column, rows.slice(0, rowPos), true, isStartingCellEmpty, isTopOfStartingCellEmpty)

    if (jumpRow) {
      return jumpRow.position - 1
    }

    return rowPos
  }

  /**
   * Find the jump target downward.
   * @param {*} rowPos - Parameter value.
   * @param {*} colPos - Parameter value.
   * @returns {*} Return value.
   */
  findJumpCellDown(rowPos, colPos) {
    const column = this.getColumnByRangePos(colPos)
    const rows = this.getTableRows()
    const isStartingCellEmpty = this.isEmpty(rows[rowPos].getData()[column.getField()])
    const isBottomOfStartingCellEmpty = rows[rowPos + 1]
      ? this.isEmpty(rows[rowPos + 1].getData()[column.getField()])
      : false
    const jumpRow = this.findJumpRow(
      column,
      rows.slice(rowPos + 1, rows.length),
      false,
      isStartingCellEmpty,
      isBottomOfStartingCellEmpty
    )

    if (jumpRow) {
      return jumpRow.position - 1
    }

    return rowPos
  }

  /// ////////////////////////////////
  /// ////      Selection      ///////
  /// ////////////////////////////////
  /**
   * Start a new selection based on source element and modifier keys.
   * @param {MouseEvent} event Mouse event.
   * @param {object} element Cell or column.
   */
  newSelection(event, element) {
    let range

    if (element.type === 'column') {
      if (!this.columnSelection) {
        return
      }

      if (element === this.rowHeader) {
        range = this.resetRanges()
        this.selecting = 'all'

        const bottomRightCell = this.getCell(-1, -1)
        const topLeftCell = this.getCell(0, this.rowHeader ? 1 : 0)

        range.setBounds(topLeftCell, bottomRightCell)
        return
      } else {
        this.selecting = 'column'
      }
    } else {
      this.selecting = element.column === this.rowHeader ? 'row' : 'cell'
    }

    if (event.shiftKey) {
      this.activeRange.setBounds(false, element, true)
    } else if (event.ctrlKey) {
      this.addRange().setBounds(element, undefined, true)
    } else {
      this.resetRanges().setBounds(element, undefined, true)
    }
  }

  /**
   * Scroll table to keep active range cell in viewport.
   * @param {Range} range Active range.
   * @param {HTMLElement} [row] Row element.
   * @param {HTMLElement} [column] Column element.
   */
  autoScroll(range, row, column) {
    const tableHolder = this.table.rowManager.element
    let rect
    let view
    let withinHorizontalView
    let withinVerticalView

    row = row || this.getRowByRangePos(range.end.row).getElement()
    column = column || this.getColumnByRangePos(range.end.col).getElement()

    rect = {
      left: column.offsetLeft,
      right: column.offsetLeft + column.offsetWidth,
      top: row.offsetTop,
      bottom: row.offsetTop + row.offsetHeight
    }

    view = {
      left: tableHolder.scrollLeft + this.getRowHeaderWidth(),
      right: Math.ceil(tableHolder.scrollLeft + tableHolder.clientWidth),
      top: tableHolder.scrollTop,
      bottom: tableHolder.scrollTop + tableHolder.offsetHeight - this.table.rowManager.scrollbarWidth
    }

    withinHorizontalView =
      view.left < rect.left && rect.left < view.right && view.left < rect.right && rect.right < view.right

    withinVerticalView =
      view.top < rect.top && rect.top < view.bottom && view.top < rect.bottom && rect.bottom < view.bottom

    if (!withinHorizontalView) {
      if (rect.left < view.left) {
        tableHolder.scrollLeft = rect.left - this.getRowHeaderWidth()
      } else if (rect.right > view.right) {
        tableHolder.scrollLeft = Math.min(rect.right - tableHolder.clientWidth, rect.left - this.getRowHeaderWidth())
      }
    }

    if (!withinVerticalView) {
      if (rect.top < view.top) {
        tableHolder.scrollTop = rect.top
      } else if (rect.bottom > view.bottom) {
        tableHolder.scrollTop = rect.bottom - tableHolder.clientHeight
      }
    }
  }

  /// ////////////////////////////////
  /// ////       Layout        ///////
  /// ////////////////////////////////

  /**
   * Queue layout recompute for range overlays.
   */
  layoutChange() {
    this.setOverlayVisible(false)
    clearTimeout(this.layoutChangeTimeout)
    this.layoutChangeTimeout = setTimeout(() => this.layoutRanges(), 200)
  }

  /**
   * Redraw range state when table redraw occurs.
   * @param {boolean} force Force full reset.
   */
  redraw(force) {
    if (force) {
      this.selecting = 'cell'
      this.resetRanges()
      this.layoutElement()
    }
  }

  /**
   * Layout rows, columns, and range overlays.
   * @param {boolean} [visibleRows] Use only visible rows.
   */
  layoutElement(visibleRows) {
    const rows = visibleRows ? this.table.rowManager.getVisibleRows(true) : this.table.rowManager.getRows()

    rows.forEach((row) => {
      if (row.type === 'row') {
        this.layoutRow(row)
        row.cells.forEach((cell) => this.renderCell(cell))
      }
    })

    this.getTableColumns().forEach((column) => {
      this.layoutColumn(column)
    })

    this.layoutRanges()
  }

  /**
   * Layout row selection/highlight classes.
   * @param {object} row Internal row.
   */
  layoutRow(row) {
    const el = row.getElement()
    let selected = false
    const occupied = this.ranges.some((range) => range.occupiesRow(row))

    if (this.selecting === 'row') {
      selected = occupied
    } else if (this.selecting === 'all') {
      selected = true
    }

    el.classList.toggle('tabulator-range-selected', selected)
    el.classList.toggle('tabulator-range-highlight', occupied)
  }

  /**
   * Layout column selection/highlight classes.
   * @param {object} column Internal column.
   */
  layoutColumn(column) {
    const el = column.getElement()
    let selected = false
    const occupied = this.ranges.some((range) => range.occupiesColumn(column))

    if (this.selecting === 'column') {
      selected = occupied
    } else if (this.selecting === 'all') {
      selected = true
    }

    el.classList.toggle('tabulator-range-selected', selected)
    el.classList.toggle('tabulator-range-highlight', occupied)
  }

  /**
   * Layout all range overlays and active cell highlight.
   */
  layoutRanges() {
    let activeCell, activeCellEl, activeRowEl

    if (!this.table.initialized) {
      return
    }

    activeCell = this.getActiveCell()

    if (!activeCell) {
      return
    }

    activeCellEl = activeCell.getElement()
    activeRowEl = activeCell.row.getElement()

    if (this.table.rtl) {
      this.activeRangeCellElement.style.right = `${activeRowEl.offsetWidth - activeCellEl.offsetLeft - activeCellEl.offsetWidth}px`
    } else {
      this.activeRangeCellElement.style.left = `${activeRowEl.offsetLeft + activeCellEl.offsetLeft}px`
    }

    this.activeRangeCellElement.style.top = `${activeRowEl.offsetTop}px`
    this.activeRangeCellElement.style.width = `${activeCellEl.offsetWidth}px`
    this.activeRangeCellElement.style.height = `${activeRowEl.offsetHeight}px`

    this.ranges.forEach((range) => range.layout())

    this.setOverlayVisible(true)
  }

  /**
   * Toggle visibility class on range overlay.
   * @param {boolean} visible Overlay visibility state.
   */
  setOverlayVisible(visible) {
    this.overlay.classList.toggle(RANGE_OVERLAY_HIDDEN_CLASS, !visible)
  }

  /// ////////////////////////////////
  /// ////  Helper Functions   ///////
  /// ////////////////////////////////

  /**
   * Resolve a visible cell by row/column index.
   * @param {number} rowIdx Row index.
   * @param {number} colIdx Column index.
   * @returns {object|null}
   */
  getCell(rowIdx, colIdx) {
    let row

    if (colIdx < 0) {
      colIdx = this.getTableColumns().length + colIdx
      if (colIdx < 0) {
        return null
      }
    }

    if (rowIdx < 0) {
      rowIdx = this.getTableRows().length + rowIdx
    }

    row = this.table.rowManager.getRowFromPosition(rowIdx + 1)

    return row ? row.getCells(false, true).filter((cell) => cell.column.visible)[colIdx] : null
  }

  /**
   * Get active selection start cell.
   * @returns {object|null}
   */
  getActiveCell() {
    return this.getCell(this.activeRange.start.row, this.activeRange.start.col)
  }

  /**
   * Get a table row from a range position.
   * @param {*} pos - Parameter value.
   * @returns {*} Return value.
   */
  getRowByRangePos(pos) {
    return this.getTableRows()[pos]
  }

  /**
   * Get a table column from a range position.
   * @param {*} pos - Parameter value.
   * @returns {*} Return value.
   */
  getColumnByRangePos(pos) {
    return this.getTableColumns()[pos]
  }

  /**
   * Get table rows used for range operations.
   * @returns {*} Return value.
   */
  getTableRows() {
    return this.table.rowManager.getDisplayRows().filter((row) => row.type === 'row')
  }

  /**
   * Get table columns used for range operations.
   * @returns {*} Return value.
   */
  getTableColumns() {
    return this.table.columnManager.getVisibleColumnsByIndex()
  }

  /**
   * Add a new range to the range collection.
   * @param {*} [start] Start cell.
   * @param {*} [end] End cell.
   * @returns {Range}
   */
  addRange(start, end) {
    let range

    if (this.maxRanges !== true && this.ranges.length >= this.maxRanges) {
      this.ranges.shift().destroy()
    }

    range = new Range(this.table, this, start, end)

    this.activeRange = range
    this.ranges.push(range)
    this.rangeContainer.appendChild(range.element)

    return range
  }

  /**
   * Reset to a single default range.
   * @returns {Range}
   */
  resetRanges() {
    let range

    this.ranges.forEach((range) => range.destroy())
    this.ranges = []

    range = this.addRange()

    if (this.table.rowManager.activeRows.length) {
      const visibleCells = this.table.rowManager.activeRows[0].cells.filter((cell) => cell.column.visible)
      const cell = visibleCells[this.rowHeader ? 1 : 0]

      if (cell) {
        range.setBounds(cell)
        if (this.options('selectableRangeAutoFocus')) {
          this.initializeFocus(cell)
        }
      }
    }

    return range
  }

  /**
   * Remove module DOM/event listeners on table destroy.
   */
  tableDestroyed() {
    document.removeEventListener('mouseup', this.mouseUpEvent)
    this.table.rowManager.element.removeEventListener('keydown', this.keyDownEvent)
  }

  /**
   * Get selected rows from active range.
   * @param {boolean} component Return row components when true.
   * @returns {Array<object>}
   */
  selectedRows(component) {
    return component ? this.activeRange.getRows().map((row) => row.getComponent()) : this.activeRange.getRows()
  }

  /**
   * Get selected columns from active range.
   * @param {boolean} component Return column components when true.
   * @returns {Array<object>}
   */
  selectedColumns(component) {
    return component ? this.activeRange.getColumns().map((col) => col.getComponent()) : this.activeRange.getColumns()
  }

  /**
   * Get current row-header column width used for range overlay alignment.
   * @returns {number}
   */
  getRowHeaderWidth() {
    if (!this.rowHeader) {
      return 0
    }
    return this.rowHeader.getElement().offsetWidth
  }

  /**
   * Check if a value is considered empty for jump navigation.
   * @param {*} value Cell value.
   * @returns {boolean}
   */
  isEmpty(value) {
    return value == null || value === ''
  }
}
