import Module from '../../core/Module.js'

export default class FrozenColumns extends Module {
  static moduleName = 'frozenColumns'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.leftColumns = []
    this.rightColumns = []
    this.initializationMode = 'left'
    this.active = false
    this.blocked = true
    this.rightMargin = '0px'

    this.registerColumnOption('frozen')
  }

  // reset initial state
  /**
   * Reset frozen column state.
   */
  reset() {
    this.initializationMode = 'left'
    this.leftColumns = []
    this.rightColumns = []
    this.active = false
    this.rightMargin = '0px'
  }

  /**
   * Initialize frozen-column subscriptions.
   */
  initialize() {
    this.subscribe('cell-layout', this.layoutCell.bind(this))
    this.subscribe('column-init', this.initializeColumn.bind(this))
    this.subscribe('column-width', this.layout.bind(this))
    this.subscribe('row-layout-after', this.layoutRow.bind(this))
    this.subscribe('table-layout', this.layout.bind(this))
    this.subscribe('columns-loading', this.reset.bind(this))

    this.subscribe('column-add', this.reinitializeColumns.bind(this))
    this.subscribe('column-deleted', this.reinitializeColumns.bind(this))
    this.subscribe('column-hide', this.reinitializeColumns.bind(this))
    this.subscribe('column-show', this.reinitializeColumns.bind(this))
    this.subscribe('columns-loaded', this.reinitializeColumns.bind(this))

    this.subscribe('table-redraw', this.layout.bind(this))
    this.subscribe('layout-refreshing', this.blockLayout.bind(this))
    this.subscribe('layout-refreshed', this.unblockLayout.bind(this))
    this.subscribe('scrollbar-vertical', this.adjustForScrollbar.bind(this))
  }

  /**
   * Block frozen layout updates.
   */
  blockLayout() {
    this.blocked = true
  }

  /**
   * Unblock frozen layout updates.
   */
  unblockLayout() {
    this.blocked = false
  }

  /**
   * Apply frozen layout to a cell.
   * @param {object} cell Internal cell.
   */
  layoutCell(cell) {
    this.layoutElement(cell.element, cell.column)
  }

  /**
   * Rebuild frozen column assignments and relayout.
   */
  reinitializeColumns() {
    this.reset()

    this.table.columnManager.columnsByIndex.forEach((column) => {
      this.initializeColumn(column)
    })

    this.layout()
  }

  // initialize specific column
  /**
   * Initialize frozen config for a column.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    const config = { margin: 0, edge: false }

    if (!column.isGroup) {
      if (this.frozenCheck(column)) {
        config.position = this.initializationMode

        if (this.initializationMode === 'left') {
          this.leftColumns.push(column)
        } else {
          this.rightColumns.unshift(column)
        }

        this.active = true

        column.modules.frozen = config
      } else {
        this.initializationMode = 'right'
      }
    }
  }

  /**
   * Determine whether a column should be treated as frozen.
   * @param {object} column Internal column.
   * @returns {boolean}
   */
  frozenCheck(column) {
    if (column.parent.isGroup && column.definition.frozen) {
      console.warn(
        'Frozen Column Error - Parent column group must be frozen, not individual columns or sub column groups'
      )
    }

    if (column.parent.isGroup) {
      return this.frozenCheck(column.parent)
    }

    return column.definition.frozen
  }

  // layout calculation rows
  /**
   * Apply frozen layout to calc rows.
   */
  layoutCalcRows() {
    if (this.table.modExists('columnCalcs')) {
      if (this.table.modules.columnCalcs.topInitialized && this.table.modules.columnCalcs.topRow) {
        this.layoutRow(this.table.modules.columnCalcs.topRow)
      }

      if (this.table.modules.columnCalcs.botInitialized && this.table.modules.columnCalcs.botRow) {
        this.layoutRow(this.table.modules.columnCalcs.botRow)
      }

      if (this.table.modExists('groupRows')) {
        this.layoutGroupCalcs(this.table.modules.groupRows.getGroups())
      }
    }
  }

  /**
   * Apply frozen layout to grouped calc rows recursively.
   * @param {Array<object>} groups Group list.
   */
  layoutGroupCalcs(groups) {
    groups.forEach((group) => {
      if (group.calcs.top) {
        this.layoutRow(group.calcs.top)
      }

      if (group.calcs.bottom) {
        this.layoutRow(group.calcs.bottom)
      }

      if (group.groupList && group.groupList.length) {
        this.layoutGroupCalcs(group.groupList)
      }
    })
  }

  // calculate column positions and layout headers
  /**
   * Compute sticky offsets and apply frozen styles to columns/cells.
   * @param {boolean} [allCells] Layout all existing cells.
   */
  layoutColumnPosition(allCells) {
    const leftParents = []

    let leftMargin = 0
    let rightMargin = 0

    this.leftColumns.forEach((column, i) => {
      column.modules.frozen.marginValue = leftMargin
      column.modules.frozen.margin = `${column.modules.frozen.marginValue}px`

      if (column.visible) {
        leftMargin += column.getWidth()
      }

      if (i === this.leftColumns.length - 1) {
        column.modules.frozen.edge = true
      } else {
        column.modules.frozen.edge = false
      }

      if (column.parent.isGroup) {
        const parentEl = this.getColGroupParentElement(column)
        if (!leftParents.includes(parentEl)) {
          this.layoutElement(parentEl, column)
          leftParents.push(parentEl)
        }

        parentEl.classList.toggle(
          'tabulator-frozen-left',
          column.modules.frozen.edge && column.modules.frozen.position === 'left'
        )
        parentEl.classList.toggle(
          'tabulator-frozen-right',
          column.modules.frozen.edge && column.modules.frozen.position === 'right'
        )
      } else {
        this.layoutElement(column.getElement(), column)
      }

      if (allCells) {
        column.cells.forEach((cell) => {
          this.layoutElement(cell.getElement(true), column)
        })
      }
    })

    this.rightColumns.forEach((column, i) => {
      column.modules.frozen.marginValue = rightMargin
      column.modules.frozen.margin = `${column.modules.frozen.marginValue}px`

      if (column.visible) {
        rightMargin += column.getWidth()
      }

      if (i === this.rightColumns.length - 1) {
        column.modules.frozen.edge = true
      } else {
        column.modules.frozen.edge = false
      }

      if (column.parent.isGroup) {
        this.layoutElement(this.getColGroupParentElement(column), column)
      } else {
        this.layoutElement(column.getElement(), column)
      }

      if (allCells) {
        column.cells.forEach((cell) => {
          this.layoutElement(cell.getElement(true), column)
        })
      }
    })

    this.rightMargin = `${rightMargin}px`
  }

  /**
   * Resolve top-most group parent element for a grouped column.
   * @param {object} column Internal column.
   * @returns {HTMLElement}
   */
  getColGroupParentElement(column) {
    return column.parent.isGroup ? this.getColGroupParentElement(column.parent) : column.getElement()
  }

  // layout columns appropriately
  /**
   * Layout frozen columns and rows.
   */
  layout() {
    if (this.active && !this.blocked) {
      // calculate left columns
      this.layoutColumnPosition()

      this.reinitializeRows()

      this.layoutCalcRows()
    }
  }

  /**
   * Reinitialize non-visible rows and layout visible rows.
   */
  reinitializeRows() {
    const visibleRows = this.table.rowManager.getVisibleRows(true)
    const otherRows = this.table.rowManager.getRows().filter((row) => !visibleRows.includes(row))

    otherRows.forEach((row) => {
      row.deinitialize()
    })

    visibleRows.forEach((row) => {
      if (row.type === 'row') {
        this.layoutRow(row)
      }
    })
  }

  /**
   * Apply frozen layout to a row.
   * @param {object} row Internal row.
   */
  layoutRow(row) {
    if (this.table.options.layout === 'fitDataFill' && this.rightColumns.length) {
      this.table.rowManager.getTableElement().style.minWidth = `calc(100% - ${this.rightMargin})`
    }

    this.leftColumns.forEach((column) => {
      const cell = row.getCell(column)

      if (cell) {
        this.layoutElement(cell.getElement(true), column)
      }
    })

    this.rightColumns.forEach((column) => {
      const cell = row.getCell(column)

      if (cell) {
        this.layoutElement(cell.getElement(true), column)
      }
    })
  }

  /**
   * Apply sticky styles to an element for a frozen column.
   * @param {HTMLElement} element Target element.
   * @param {object} column Internal column.
   */
  layoutElement(element, column) {
    const frozen = column.modules.frozen

    if (frozen && element) {
      element.style.position = 'sticky'

      const position = this.table.rtl ? (frozen.position === 'left' ? 'right' : 'left') : frozen.position

      element.style[position] = frozen.margin

      element.classList.add('tabulator-frozen')

      element.classList.toggle('tabulator-frozen-left', frozen.edge && frozen.position === 'left')
      element.classList.toggle('tabulator-frozen-right', frozen.edge && frozen.position === 'right')
    }
  }

  /**
   * Adjust contents width for vertical scrollbar.
   * @param {number} width Scrollbar width.
   */
  adjustForScrollbar(width) {
    if (this.rightColumns.length) {
      this.table.columnManager.getContentsElement().style.width = `calc(100% - ${width}px)`
    }
  }

  /**
   * Get all frozen columns.
   * @returns {Array<object>}
   */
  getFrozenColumns() {
    return this.leftColumns.concat(this.rightColumns)
  }

  /**
   * Calculate occupied width before a column index.
   * @param {Array<object>} columns Column list.
   * @param {number} index Target index.
   * @returns {number}
   */
  _calcSpace(columns, index) {
    let width = 0

    for (let i = 0; i < index; i++) {
      if (columns[i].visible) {
        width += columns[i].getWidth()
      }
    }

    return width
  }
}
