import Module from '../../core/Module.js'

export default class ResizeColumns extends Module {
  static moduleName = 'resizeColumns'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.startColumn = false
    this.startX = false
    this.startWidth = false
    this.latestX = false
    this.handle = null
    this.initialNextColumn = null
    this.nextColumn = null

    this.initialized = false
    this.registerColumnOption('resizable', true)
    this.registerTableOption('resizableColumnFit', false)
    this.registerTableOption('resizableColumnGuide', false)
  }

  /**
   * Initialize column resize header listener.
   * @returns {void}
   */
  initialize() {
    this.subscribe('column-rendered', this.layoutColumnHeader.bind(this))
  }

  /**
   * Initialize one-time resize event watchers.
   * @returns {void}
   */
  initializeEventWatchers() {
    if (!this.initialized) {
      this.subscribe('cell-rendered', this.layoutCellHandles.bind(this))
      this.subscribe('cell-delete', this.deInitializeComponent.bind(this))

      this.subscribe('cell-height', this.resizeHandle.bind(this))
      this.subscribe('column-moved', this.columnLayoutUpdated.bind(this))

      this.subscribe('column-hide', this.deInitializeColumn.bind(this))
      this.subscribe('column-show', this.columnLayoutUpdated.bind(this))
      this.subscribe('column-width', this.columnWidthUpdated.bind(this))

      this.subscribe('column-delete', this.deInitializeComponent.bind(this))
      this.subscribe('column-height', this.resizeHandle.bind(this))

      this.initialized = true
    }
  }

  /**
   * Layout cell resize handles.
   * @param {object} cell Internal cell.
   * @returns {void}
   */
  layoutCellHandles(cell) {
    if (cell.row.type === 'row') {
      this.deInitializeComponent(cell)
      this.initializeColumn('cell', cell, cell.column, cell.element)
    }
  }

  /**
   * Layout column header resize handles.
   * @param {object} column Internal column.
   * @returns {void}
   */
  layoutColumnHeader(column) {
    if (column.definition.resizable) {
      this.initializeEventWatchers()
      this.deInitializeComponent(column)
      this.initializeColumn('header', column, column, column.element)
    }
  }

  /**
   * Reinitialize resize handles after column layout changes.
   * @param {object} column Internal column.
   * @returns {void}
   */
  columnLayoutUpdated(column) {
    const prev = column.prevColumn()

    this.reinitializeColumn(column)

    if (prev) {
      this.reinitializeColumn(prev)
    }
  }

  /**
   * Reinitialize frozen handle offsets after width changes.
   * @param {object} column Internal column.
   * @returns {void}
   */
  columnWidthUpdated(column) {
    if (column.modules.frozen) {
      if (this.table.modules.frozenColumns.leftColumns.includes(column)) {
        this.table.modules.frozenColumns.leftColumns.forEach((col) => {
          this.reinitializeColumn(col)
        })
      } else if (this.table.modules.frozenColumns.rightColumns.includes(column)) {
        this.table.modules.frozenColumns.rightColumns.forEach((col) => {
          this.reinitializeColumn(col)
        })
      }
    }
  }

  /**
   * Compute sticky offset for frozen column resize handles.
   * @param {object} column Internal column.
   * @returns {string|boolean}
   */
  frozenColumnOffset(column) {
    let offset = false

    if (column.modules.frozen) {
      offset = column.modules.frozen.marginValue

      if (column.modules.frozen.position === 'left') {
        offset += column.getWidth() - 3
      } else {
        if (offset) {
          offset -= 3
        }
      }
    }

    return offset !== false ? offset + 'px' : false
  }

  /**
   * Get horizontal pointer coordinate from mouse or touch event.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @returns {number}
   */
  getClientX(e) {
    return typeof e.clientX === 'undefined' ? e.touches[0].clientX : e.clientX
  }

  /**
   * Reattach column/cell resize handles after layout updates.
   * @param {object} column Internal column.
   * @returns {void}
   */
  reinitializeColumn(column) {
    const frozenOffset = this.frozenColumnOffset(column)

    column.cells.forEach((cell) => {
      if (cell.modules.resize && cell.modules.resize.handleEl) {
        if (frozenOffset) {
          cell.modules.resize.handleEl.style[column.modules.frozen.position] = frozenOffset
          cell.modules.resize.handleEl.style['z-index'] = 11
        }

        cell.element.after(cell.modules.resize.handleEl)
      }
    })

    if (column.modules.resize && column.modules.resize.handleEl) {
      if (frozenOffset) {
        column.modules.resize.handleEl.style[column.modules.frozen.position] = frozenOffset
      }

      column.element.after(column.modules.resize.handleEl)
    }
  }

  /**
   * Initialize resize handle for a column header or cell.
   * @param {string} type Handle type.
   * @param {object} component Target component.
   * @param {object} column Internal column.
   * @param {HTMLElement} element Target element.
   * @returns {void}
   */
  initializeColumn(type, component, column, element) {
    let variableHeight
    const mode = column.definition.resizable
    let config = {}
    const nearestColumn = column.getLastColumn()

    // set column resize mode
    if (type === 'header') {
      variableHeight = column.definition.formatter === 'textarea' || column.definition.variableHeight
      config = { variableHeight }
    }

    if ((mode === true || mode === type) && this._checkResizability(nearestColumn)) {
      const handle = document.createElement('span')
      handle.className = 'tabulator-col-resize-handle'

      handle.addEventListener('click', (e) => {
        e.stopPropagation()
      })

      const handleDown = (e) => {
        this.startColumn = column
        this.initialNextColumn = this.nextColumn = nearestColumn.nextColumn()
        this._mouseDown(e, nearestColumn, handle)
      }

      handle.addEventListener('mousedown', handleDown)
      handle.addEventListener('touchstart', handleDown, { passive: true })

      // resize column on  double click
      handle.addEventListener('dblclick', (e) => {
        const oldWidth = nearestColumn.getWidth()

        e.stopPropagation()
        nearestColumn.reinitializeWidth(true)

        if (oldWidth !== nearestColumn.getWidth()) {
          this.dispatch('column-resized', nearestColumn)
          this.dispatchExternal('columnResized', nearestColumn.getComponent())
        }
      })

      if (column.modules.frozen) {
        handle.style.position = 'sticky'
        handle.style[column.modules.frozen.position] = this.frozenColumnOffset(column)
      }

      config.handleEl = handle

      if (element.parentNode && column.visible) {
        element.after(handle)
      }
    }

    component.modules.resize = config
  }

  /**
   * Remove resize handles for a column and its cells.
   * @param {object} column Internal column.
   * @returns {void}
   */
  deInitializeColumn(column) {
    this.deInitializeComponent(column)

    column.cells.forEach((cell) => {
      this.deInitializeComponent(cell)
    })
  }

  /**
   * Remove resize handle from a component.
   * @param {object} component Target component.
   * @returns {void}
   */
  deInitializeComponent(component) {
    let handleEl

    if (component.modules.resize) {
      handleEl = component.modules.resize.handleEl

      if (handleEl && handleEl.parentElement) {
        handleEl.parentElement.removeChild(handleEl)
      }
    }
  }

  /**
   * Sync resize handle height with component height.
   * @param {object} component Target component.
   * @param {string} height CSS height value.
   * @returns {void}
   */
  resizeHandle(component, height) {
    if (component.modules.resize && component.modules.resize.handleEl) {
      component.modules.resize.handleEl.style.height = height
    }
  }

  /**
   * Apply column width changes during pointer drag.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @param {object} column Internal column.
   * @returns {void}
   */
  resize(e, column) {
    const x = this.getClientX(e)
    let startDiff = x - this.startX
    let moveDiff = x - this.latestX
    let blockedBefore
    let blockedAfter

    this.latestX = x

    if (this.table.rtl) {
      startDiff = -startDiff
      moveDiff = -moveDiff
    }

    blockedBefore = column.width === column.minWidth || column.width === column.maxWidth

    column.setWidth(this.startWidth + startDiff)

    blockedAfter = column.width === column.minWidth || column.width === column.maxWidth

    if (moveDiff < 0) {
      this.nextColumn = this.initialNextColumn
    }

    if (this.table.options.resizableColumnFit && this.nextColumn && !(blockedBefore && blockedAfter)) {
      const colWidth = this.nextColumn.getWidth()

      if (moveDiff > 0) {
        if (colWidth <= this.nextColumn.minWidth) {
          this.nextColumn = this.nextColumn.nextColumn()
        }
      }

      if (this.nextColumn) {
        this.nextColumn.setWidth(this.nextColumn.getWidth() - moveDiff)
      }
    }

    this.table.columnManager.rerenderColumns(true)

    if (!this.table.browserSlow && column.modules.resize && column.modules.resize.variableHeight) {
      column.checkCellHeights()
    }
  }

  /**
   * Calculate guide x-position during column resize.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @param {object} column Internal column.
   * @param {HTMLElement} handle Active handle.
   * @returns {number}
   */
  calcGuidePosition(e, column, handle) {
    const mouseX = this.getClientX(e)
    const handleX = handle.getBoundingClientRect().x - this.table.element.getBoundingClientRect().x
    const tableX = this.table.element.getBoundingClientRect().x
    const columnX = column.element.getBoundingClientRect().left - tableX
    const mouseDiff = mouseX - this.startX
    let pos = Math.max(handleX + mouseDiff, columnX + column.minWidth)

    if (column.maxWidth) {
      pos = Math.min(pos, columnX + column.maxWidth)
    }

    return pos
  }

  /**
   * Determine if a column is resizable.
   * @param {object} column Internal column.
   * @returns {boolean}
   */
  _checkResizability(column) {
    return column.definition.resizable
  }

  /**
   * Handle column resize drag start.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @param {object} column Internal column.
   * @param {HTMLElement} handle Active handle.
   * @returns {void}
   */
  _mouseDown(e, column, handle) {
    let guideEl

    this.dispatchExternal('columnResizing', column.getComponent())

    if (this.table.options.resizableColumnGuide) {
      guideEl = document.createElement('span')
      guideEl.classList.add('tabulator-col-resize-guide')
      this.table.element.appendChild(guideEl)
      setTimeout(() => {
        guideEl.style.left = `${this.calcGuidePosition(e, column, handle)}px`
      })
    }

    this.table.element.classList.add('tabulator-block-select')

    const mouseMove = (e) => {
      if (this.table.options.resizableColumnGuide) {
        guideEl.style.left = `${this.calcGuidePosition(e, column, handle)}px`
      } else {
        this.resize(e, column)
      }
    }

    const mouseUp = (e) => {
      if (this.table.options.resizableColumnGuide) {
        this.resize(e, column)
        guideEl.remove()
      }

      // block editor from taking action while resizing is taking place
      if (this.startColumn.modules.edit) {
        this.startColumn.modules.edit.blocked = false
      }

      if (this.table.browserSlow && column.modules.resize && column.modules.resize.variableHeight) {
        column.checkCellHeights()
      }

      document.body.removeEventListener('mouseup', mouseUp)
      document.body.removeEventListener('mousemove', mouseMove)

      handle.removeEventListener('touchmove', mouseMove)
      handle.removeEventListener('touchend', mouseUp)

      this.table.element.classList.remove('tabulator-block-select')

      if (this.startWidth !== column.getWidth()) {
        this.table.columnManager.verticalAlignHeaders()

        this.dispatch('column-resized', column)
        this.dispatchExternal('columnResized', column.getComponent())
      }
    }

    e.stopPropagation() // prevent resize from interfering with movable columns

    // block editor from taking action while resizing is taking place
    if (this.startColumn.modules.edit) {
      this.startColumn.modules.edit.blocked = true
    }

    this.startX = this.getClientX(e)
    this.latestX = this.startX
    this.startWidth = column.getWidth()

    document.body.addEventListener('mousemove', mouseMove)
    document.body.addEventListener('mouseup', mouseUp)
    handle.addEventListener('touchmove', mouseMove, { passive: true })
    handle.addEventListener('touchend', mouseUp)
  }
}
