import CoreFeature from '../CoreFeature.js'
import RowComponent from './RowComponent.js'
import Helpers from '../tools/Helpers.js'

export default class Row extends CoreFeature {
  /**
   * @param {object} data Row data object.
   * @param {object} parent Parent row manager or group.
   * @param {string} [type='row'] Row type identifier.
   */
  constructor(data, parent, type = 'row') {
    super(parent.table)

    this.parent = parent
    this.data = {}
    this.type = type // type of element
    this.element = false
    this.modules = {} // hold module variables;
    this.cells = []
    this.height = 0 // hold element height
    this.heightStyled = '' // hold element height pre-styled to improve render efficiency
    this.manualHeight = false // user has manually set row height
    this.outerHeight = 0 // hold elements outer height
    this.initialized = false // element has been rendered
    this.heightInitialized = false // element has resized cells to fit
    this.position = 0 // store position of element in row list
    this.positionWatchers = []

    this.component = null

    this.created = false

    this.setData(data)
  }

  /**
   * Lazily create the row DOM element.
   */
  create() {
    if (!this.created) {
      this.created = true
      this.generateElement()
    }
  }

  /**
   * Create the base row DOM element.
   */
  createElement() {
    const element = document.createElement('div')

    element.classList.add('tabulator-row')
    element.setAttribute('role', 'row')

    this.element = element
  }

  /**
   * Return row DOM element, creating it when needed.
   * @returns {HTMLElement|boolean}
   */
  getElement() {
    this.create()
    return this.element
  }

  /**
   * Detach the row element from the DOM if currently attached.
   */
  detachElement() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }

  /**
   * Generate row element and emit initialization event.
   */
  generateElement() {
    this.createElement()
    this.dispatch('row-init', this)
  }

  /**
   * Generate cell objects for this row.
   */
  generateCells() {
    this.cells = this.table.columnManager.generateCells(this)
  }

  /**
   * Initialize row cells and layout.
   * @param {boolean} [force] Force reinitialization.
   * @param {boolean} [inFragment] Render in a detached fragment when true.
   */
  initialize(force, inFragment) {
    this.create()

    if (!this.initialized || force) {
      this.deleteCells()

      this.element.replaceChildren()

      this.dispatch('row-layout-before', this)

      this.generateCells()

      this.initialized = true

      this.table.columnManager.renderer.renderRowCells(this, inFragment)

      if (force) {
        this.normalizeHeight()
      }

      this.dispatch('row-layout', this)

      if (this.table.options.rowFormatter) {
        this.table.options.rowFormatter(this.getComponent())
      }

      this.dispatch('row-layout-after', this)
    } else {
      this.table.columnManager.renderer.rerenderRowCells(this, inFragment)
    }
  }

  /**
   * Dispatch rendered hooks for all row cells.
   */
  rendered() {
    this.cells.forEach((cell) => {
      cell.cellRendered()
    })
  }

  /**
   * Mark height as stale and normalize if row is currently in the document flow.
   */
  reinitializeHeight() {
    this.heightInitialized = false

    if (this.element && this.element.offsetParent !== null) {
      this.normalizeHeight(true)
    }
  }

  /**
   * Mark this row as not initialized.
   */
  deinitialize() {
    this.initialized = false
  }

  /**
   * Mark row height as not initialized.
   */
  deinitializeHeight() {
    this.heightInitialized = false
  }

  /**
   * Reinitialize row layout state.
   */
  reinitialize() {
    this.initialized = false
    this.heightInitialized = false

    if (!this.manualHeight) {
      this.height = 0
      this.heightStyled = ''
    }

    if (this.element && this.element.offsetParent !== null) {
      this.initialize(true)
    }

    this.dispatch('row-relayout', this)
  }

  /**
   * Calculate row height and cache styled/outer heights.
   * @param {boolean} [force] Ignore manual height and recalculate when true.
   */
  calcHeight(force) {
    let maxHeight
    let minHeight

    if (this.table.options.rowHeight) {
      this.height = this.table.options.rowHeight
    } else {
      minHeight = this.calcMinHeight()
      maxHeight = this.calcMaxHeight()

      if (force) {
        this.height = Math.max(maxHeight, minHeight)
      } else {
        this.height = this.manualHeight ? this.height : Math.max(maxHeight, minHeight)
      }
    }

    this.heightStyled = this.height ? `${this.height}px` : ''
    this.outerHeight = this.element.offsetHeight
  }

  /**
   * Calculate minimum row height.
   * @returns {number}
   */
  calcMinHeight() {
    return this.table.options.resizableRows ? this.element.clientHeight : 0
  }

  /**
   * Calculate maximum cell height in this row.
   * @returns {number}
   */
  calcMaxHeight() {
    let maxHeight = 0

    this.cells.forEach((cell) => {
      const height = cell.getHeight()

      if (height > maxHeight) {
        maxHeight = height
      }
    })

    return maxHeight
  }

  /**
   * Apply current row height to all cells.
   */
  setCellHeight() {
    this.cells.forEach((cell) => {
      cell.setHeight()
    })

    this.heightInitialized = true
  }

  /**
   * Clear explicit height on all row cells.
   */
  clearCellHeight() {
    this.cells.forEach((cell) => {
      cell.clearHeight()
    })
  }

  /**
   * Normalize row and cell heights.
   * @param {boolean} [force] Clear existing cell heights before recalculating.
   */
  normalizeHeight(force) {
    if (force && !this.table.options.rowHeight) {
      this.clearCellHeight()
    }

    this.calcHeight(force)

    this.setCellHeight()
  }

  /**
   * Set row height explicitly.
   * @param {number} height Row height in pixels.
   * @param {boolean} [force] Force update when true.
   */
  setHeight(height, force) {
    if (this.height !== height || force) {
      this.manualHeight = true

      this.height = height
      this.heightStyled = height ? `${height}px` : ''

      this.setCellHeight()

      // this.outerHeight = this.element.outerHeight();
      this.outerHeight = this.element.offsetHeight

      if (this.subscribedExternal('rowHeight')) {
        this.dispatchExternal('rowHeight', this.getComponent())
      }
    }
  }

  /**
   * Return rendered outer row height.
   * @returns {number}
   */
  getHeight() {
    return this.outerHeight
  }

  /**
   * Return rendered row width.
   * @returns {number}
   */
  getWidth() {
    return this.getElement().offsetWidth
  }

  /// ///////////// Cell Management /////////////////
  /**
   * Remove a cell from the row cell collection.
   * @param {object} cell Internal cell instance.
   */
  deleteCell(cell) {
    const index = this.cells.indexOf(cell)

    if (index > -1) {
      this.cells.splice(index, 1)
    }
  }

  /// ///////////// Data Management /////////////////
  /**
   * Set initial row data with lifecycle hooks.
   * @param {object} data Row data object.
   */
  setData(data) {
    this.data = this.chain('row-data-init-before', [this, data], undefined, data)

    this.dispatch('row-data-init-after', this)
  }

  /**
   * Patch row data and refresh impacted cells.
   * @param {object|string} updatedData Partial update object or serialized JSON.
   * @returns {Promise<void>}
   */
  updateData(updatedData) {
    const visible = this.element && Helpers.elVisible(this.element)
    let tempData = {}
    let newRowData
    let component

    return new Promise((resolve) => {
      if (typeof updatedData === 'string') {
        updatedData = JSON.parse(updatedData)
      }

      this.dispatch('row-data-save-before', this)

      if (this.subscribed('row-data-changing')) {
        tempData = {
          ...this.data,
          ...updatedData
        }
      }

      newRowData = this.chain('row-data-changing', [this, tempData, updatedData], null, updatedData)

      // set data
      for (const attrname in newRowData) {
        this.data[attrname] = newRowData[attrname]
      }

      this.dispatch('row-data-save-after', this)

      // update affected cells only
      for (const attrname in updatedData) {
        const columns = this.table.columnManager.getColumnsByFieldRoot(attrname)

        columns.forEach((column) => {
          const cell = this.getCell(column.getField())

          if (cell) {
            const value = column.getFieldValue(newRowData)
            if (cell.getValue() !== value) {
              cell.setValueProcessData(value)

              if (visible) {
                cell.cellRendered()
              }
            }
          }
        })
      }

      // Partial reinitialization if visible
      if (visible) {
        this.normalizeHeight(true)

        if (this.table.options.rowFormatter) {
          component = this.getComponent()
          this.table.options.rowFormatter(component)
        }
      } else {
        this.initialized = false
        this.height = 0
        this.heightStyled = ''
      }

      this.dispatch('row-data-changed', this, visible, updatedData)

      // this.reinitialize();

      this.dispatchExternal('rowUpdated', component || this.getComponent())

      if (this.subscribedExternal('dataChanged')) {
        this.dispatchExternal('dataChanged', this.table.rowManager.getData())
      }

      resolve()
    })
  }

  /**
   * Return row data optionally transformed.
   * @param {string|boolean} [transform] Optional transform lookup key.
   * @returns {object}
   */
  getData(transform) {
    if (transform) {
      return this.chain('row-data-retrieve', [this, transform], null, this.data)
    }

    return this.data
  }

  /**
   * Get a cell by column lookup input.
   * @param {*} column Column lookup accepted by column manager.
   * @returns {object|undefined}
   */
  getCell(column) {
    let match

    column = this.table.columnManager.findColumn(column)

    if (!this.initialized && this.cells.length === 0) {
      this.generateCells()
    }

    match = this.cells.find((cell) => cell.column === column)

    return match
  }

  /**
   * Get index of the provided cell.
   * @param {object} findCell Cell instance to find.
   * @returns {number}
   */
  getCellIndex(findCell) {
    return this.cells.findIndex((cell) => cell === findCell)
  }

  /**
   * Find a cell by DOM element reference.
   * @param {HTMLElement} subject Cell element.
   * @returns {object|undefined}
   */
  findCell(subject) {
    return this.cells.find((cell) => cell.element === subject)
  }

  /**
   * Return all cells in this row.
   * @returns {Array<object>}
   */
  getCells() {
    if (!this.initialized && this.cells.length === 0) {
      this.generateCells()
    }

    return this.cells
  }

  /**
   * Get the next displayed row.
   * @returns {object|boolean}
   */
  nextRow() {
    const row = this.table.rowManager.nextDisplayRow(this, true)
    return row || false
  }

  /**
   * Get the previous displayed row.
   * @returns {object|boolean}
   */
  prevRow() {
    const row = this.table.rowManager.prevDisplayRow(this, true)
    return row || false
  }

  /**
   * Move this row before or after another row.
   * @param {*} to Target row lookup value.
   * @param {boolean} before Insert before when true.
   */
  moveToRow(to, before) {
    const toRow = this.table.rowManager.findRow(to)

    if (toRow) {
      this.table.rowManager.moveRowActual(this, toRow, !before)
      this.table.rowManager.refreshActiveData('display', false, true)
    } else {
      console.warn('Move Error - No matching row found:', to)
    }
  }

  /// ////////////////// Actions  /////////////////////
  /**
   * Delete this row.
   * @returns {Promise<void>}
   */
  delete() {
    this.dispatch('row-delete', this)

    this.deleteActual()

    return Promise.resolve()
  }

  /**
   * Delete row internals and unregister from row manager.
   * @param {boolean} [blockRedraw] Prevent redraw while deleting.
   */
  deleteActual(blockRedraw) {
    this.detachModules()

    this.table.rowManager.deleteRow(this, blockRedraw)

    this.deleteCells()

    this.initialized = false
    this.heightInitialized = false
    this.element = null

    this.dispatch('row-deleted', this)
  }

  /**
   * Detach module state before deletion.
   */
  detachModules() {
    this.dispatch('row-deleting', this)
  }

  /**
   * Delete all cells owned by this row.
   */
  deleteCells() {
    const cellCount = this.cells.length

    for (let i = 0; i < cellCount; i++) {
      this.cells[0].delete()
    }
  }

  /**
   * Remove all row DOM/module state without row-manager deletion.
   */
  wipe() {
    this.detachModules()
    this.deleteCells()

    if (this.element) {
      this.element.replaceChildren()

      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element)
      }
    }

    this.element = null
    this.modules = {}
  }

  /**
   * Determine if this row is in current display rows.
   * @returns {boolean}
   */
  isDisplayed() {
    return this.table.rowManager.getDisplayRows().includes(this)
  }

  /**
   * Return display position when row is displayed.
   * @returns {number|boolean}
   */
  getPosition() {
    return this.isDisplayed() ? this.position : false
  }

  /**
   * Set row display position and notify watchers.
   * @param {number} position New position index.
   */
  setPosition(position) {
    if (position !== this.position) {
      this.position = position

      this.positionWatchers.forEach((callback) => {
        callback(this.position)
      })
    }
  }

  /**
   * Subscribe to row position updates.
   * @param {Function} callback Position callback.
   */
  watchPosition(callback) {
    this.positionWatchers.push(callback)

    callback(this.position)
  }

  /**
   * Get group module wrapper for this row.
   * @returns {object|boolean}
   */
  getGroup() {
    return this.modules.group || false
  }

  /// ///////////// Object Generation /////////////////
  /**
   * Get or lazily create the public row component.
   * @returns {RowComponent}
   */
  getComponent() {
    if (!this.component) {
      this.component = new RowComponent(this)
    }

    return this.component
  }
}
