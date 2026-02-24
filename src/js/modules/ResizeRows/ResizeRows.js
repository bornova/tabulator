import Module from '../../core/Module.js'

export default class ResizeRows extends Module {
  static moduleName = 'resizeRows'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.startColumn = false
    this.startY = false
    this.startHeight = false
    this.handle = null
    this.prevHandle = null

    this.registerTableOption('resizableRows', false) // resizable rows
    this.registerTableOption('resizableRowGuide', false)
  }

  /**
   * Initialize row resize handlers.
   * @returns {void}
   */
  initialize() {
    if (this.table.options.resizableRows) {
      this.subscribe('row-layout-after', this.initializeRow.bind(this))
    }
  }

  /**
   * Get vertical screen coordinate from mouse or touch event.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @returns {number}
   */
  getScreenY(e) {
    if (typeof e.screenY !== 'undefined') {
      return e.screenY
    }

    if (e.touches && e.touches.length) {
      return e.touches[0].screenY
    }

    return e.changedTouches && e.changedTouches.length ? e.changedTouches[0].screenY : 0
  }

  /**
   * Attach row resize handles to a row element.
   * @param {object} row Internal row.
   * @returns {void}
   */
  initializeRow(row) {
    const rowEl = row.getElement()

    const handle = document.createElement('div')
    handle.className = 'tabulator-row-resize-handle'

    const prevHandle = document.createElement('div')
    prevHandle.className = 'tabulator-row-resize-handle prev'

    handle.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    const handleDown = (e) => {
      this.startRow = row
      this._mouseDown(e, row, handle)
    }

    handle.addEventListener('mousedown', handleDown)
    handle.addEventListener('touchstart', handleDown, { passive: true })

    prevHandle.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    const prevHandleDown = (e) => {
      const prevRow = this.table.rowManager.prevDisplayRow(row)

      if (prevRow) {
        this.startRow = prevRow
        this._mouseDown(e, prevRow, prevHandle)
      }
    }

    prevHandle.addEventListener('mousedown', prevHandleDown)
    prevHandle.addEventListener('touchstart', prevHandleDown, { passive: true })

    rowEl.appendChild(handle)
    rowEl.appendChild(prevHandle)
  }

  /**
   * Apply row height resize based on pointer movement.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @param {object} row Internal row.
   * @returns {void}
   */
  resize(e, row) {
    row.setHeight(this.startHeight + (this.getScreenY(e) - this.startY))
  }

  /**
   * Calculate guide position during row resize.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @param {object} row Internal row.
   * @param {HTMLElement} handle Active handle.
   * @returns {number}
   */
  calcGuidePosition(e, row, handle) {
    const mouseY = this.getScreenY(e)
    const handleY = handle.getBoundingClientRect().y - this.table.element.getBoundingClientRect().y
    const tableY = this.table.element.getBoundingClientRect().y
    const rowY = row.element.getBoundingClientRect().top - tableY
    const mouseDiff = mouseY - this.startY

    return Math.max(handleY + mouseDiff, rowY)
  }

  /**
   * Handle row resize drag start.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @param {object} row Internal row.
   * @param {HTMLElement} handle Active handle.
   * @returns {void}
   */
  _mouseDown(e, row, handle) {
    let guideEl

    this.dispatchExternal('rowResizing', row.getComponent())

    if (this.table.options.resizableRowGuide) {
      guideEl = document.createElement('span')
      guideEl.classList.add('tabulator-row-resize-guide')
      this.table.element.appendChild(guideEl)
      setTimeout(() => {
        guideEl.style.top = `${this.calcGuidePosition(e, row, handle)}px`
      })
    }

    this.table.element.classList.add('tabulator-block-select')

    const mouseMove = (e) => {
      if (this.table.options.resizableRowGuide) {
        guideEl.style.top = `${this.calcGuidePosition(e, row, handle)}px`
      } else {
        this.resize(e, row)
      }
    }

    const mouseUp = (e) => {
      if (this.table.options.resizableRowGuide) {
        this.resize(e, row)
        guideEl.remove()
      }

      // //block editor from taking action while resizing is taking place
      // if(self.startColumn.modules.edit){
      // 	self.startColumn.modules.edit.blocked = false;
      // }

      document.body.removeEventListener('mouseup', mouseUp)
      document.body.removeEventListener('mousemove', mouseMove)

      handle.removeEventListener('touchmove', mouseMove)
      handle.removeEventListener('touchend', mouseUp)

      this.table.element.classList.remove('tabulator-block-select')

      this.dispatchExternal('rowResized', row.getComponent())
    }

    e.stopPropagation() // prevent resize from interfering with movable columns

    // block editor from taking action while resizing is taking place
    // if(self.startColumn.modules.edit){
    // 	self.startColumn.modules.edit.blocked = true;
    // }

    this.startY = this.getScreenY(e)
    this.startHeight = row.getHeight()

    document.body.addEventListener('mousemove', mouseMove)
    document.body.addEventListener('mouseup', mouseUp)

    handle.addEventListener('touchmove', mouseMove, { passive: true })
    handle.addEventListener('touchend', mouseUp)
  }
}
