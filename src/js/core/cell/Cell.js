import CoreFeature from '../CoreFeature.js'
import CellComponent from './CellComponent.js'

const VERTICAL_ALIGN_TO_FLEX = {
  top: 'flex-start',
  bottom: 'flex-end',
  middle: 'center'
}

const HORIZONTAL_ALIGN_TO_FLEX = {
  left: 'flex-start',
  right: 'flex-end',
  center: 'center'
}

export default class Cell extends CoreFeature {
  /**
   * @param {object} column Column instance that owns this cell.
   * @param {object} row Row instance that owns this cell.
   */
  constructor(column, row) {
    super(column.table)

    this.table = column.table
    this.column = column
    this.row = row
    this.element = null
    this.value = null
    this.initialValue = undefined
    this.oldValue = null
    this.modules = {}

    this.height = null
    this.width = null
    this.minWidth = null
    this.maxWidth = null

    this.component = null

    this.loaded = false // track if the cell has been added to the DOM yet

    this.build()
  }

  /// ///////////// Setup Functions /////////////////
  /**
   * Build the cell element and initialize its value.
   */
  build() {
    this.generateElement()

    this.setWidth()

    this._configureCell()

    this.setValueActual(this.column.getFieldValue(this.row.data))

    this.initialValue = this.value
  }

  /**
   * Create the base DOM element used by the cell.
   */
  generateElement() {
    this.element = document.createElement('div')
    this.element.className = 'tabulator-cell'
    this.element.setAttribute('role', 'gridcell')

    if (this.column.isRowHeader) {
      this.element.classList.add('tabulator-row-header')
    }
  }

  /**
   * Apply display attributes and classes to the cell element.
   */
  _configureCell() {
    const element = this.element
    const field = this.column.getField()

    // set text alignment
    if (this.column.hozAlign) {
      element.style.justifyContent = HORIZONTAL_ALIGN_TO_FLEX[this.column.hozAlign] || ''
    }

    if (this.column.vertAlign) {
      element.classList.add('tabulator-cell-inline-flex')

      element.style.alignItems = VERTICAL_ALIGN_TO_FLEX[this.column.vertAlign] || ''

      if (this.column.hozAlign) {
        element.style.justifyContent = HORIZONTAL_ALIGN_TO_FLEX[this.column.hozAlign] || ''
      }
    }

    if (field) {
      element.setAttribute('tabulator-field', field)
    }

    // add class to cell if needed
    if (this.column.definition.cssClass) {
      const classNames = this.column.definition.cssClass.split(/\s+/).filter(Boolean)
      classNames.forEach((className) => {
        element.classList.add(className)
      })
    }

    this.dispatch('cell-init', this)

    // hide cell if not visible
    if (!this.column.visible) {
      this.hide()
    }
  }

  /**
   * Generate and render the formatted cell contents.
   */
  _generateContents() {
    const val = this.chain('cell-format', this, null, () => (this.element.innerHTML = this.value))

    switch (typeof val) {
      case 'object':
        if (val instanceof Node) {
          this.element.replaceChildren(val)
        } else {
          this.element.innerHTML = ''

          if (val != null) {
            console.warn(
              'Format Error - Formatter has returned a type of object, the only valid formatter object return is an instance of Node, the formatter returned:',
              val
            )
          }
        }
        break
      case 'undefined':
        this.element.innerHTML = ''
        break
      default:
        this.element.innerHTML = val
    }
  }

  /**
   * Dispatch the rendered hook for the cell.
   */
  cellRendered() {
    this.dispatch('cell-rendered', this)
  }

  /// ///////////////// Getters ////////////////////
  /**
   * Get the cell DOM element, laying it out the first time it is requested.
   * @param {boolean} [containerOnly] Skip layout when true.
   * @returns {HTMLElement|null}
   */
  getElement(containerOnly) {
    if (!this.loaded) {
      this.loaded = true
      if (!containerOnly) {
        this.layoutElement()
      }
    }

    return this.element
  }

  /**
   * Get the current cell value.
   * @returns {*}
   */
  getValue() {
    return this.value
  }

  /**
   * Get the previous cell value.
   * @returns {*}
   */
  getOldValue() {
    return this.oldValue
  }

  /// ///////////////// Actions ////////////////////
  /**
   * Update the cell value and dispatch edit/data change events.
   * @param {*} value New value.
   * @param {boolean} [mutate] Run value mutation pipeline when true.
   * @param {boolean} [force] Force update even if value is unchanged.
   */
  setValue(value, mutate, force) {
    const changed = this.setValueProcessData(value, mutate, force)

    if (changed) {
      const component = this.getComponent()

      this.dispatch('cell-value-updated', this)

      this.cellRendered()

      if (this.column.definition.cellEdited) {
        this.column.definition.cellEdited.call(this.table, component)
      }

      this.dispatchExternal('cellEdited', component)

      if (this.subscribedExternal('dataChanged')) {
        this.dispatchExternal('dataChanged', this.table.rowManager.getData())
      }
    }
  }

  /**
   * Process value changes and trigger internal change events.
   * @param {*} value New value.
   * @param {boolean} [mutate] Run value mutation pipeline when true.
   * @param {boolean} [force] Force update even if value is unchanged.
   * @returns {boolean} True when the value is considered changed.
   */
  setValueProcessData(value, mutate, force) {
    let changed = false

    if (this.value !== value || force) {
      changed = true

      if (mutate) {
        value = this.chain('cell-value-changing', [this, value], null, value)
      }
    }

    this.setValueActual(value)

    if (changed) {
      this.dispatch('cell-value-changed', this)
    }

    return changed
  }

  /**
   * Persist the value onto row data and update rendered content when needed.
   * @param {*} value New value.
   */
  setValueActual(value) {
    this.oldValue = this.value

    this.value = value

    this.dispatch('cell-value-save-before', this)

    this.column.setFieldValue(this.row.data, value)

    this.dispatch('cell-value-save-after', this)

    if (this.loaded) {
      this.layoutElement()
    }
  }

  /**
   * Rebuild the cell layout and notify listeners.
   */
  layoutElement() {
    this._generateContents()

    this.dispatch('cell-layout', this)
  }

  /**
   * Apply current column width to the cell element.
   */
  setWidth() {
    const width = this.column.width
    const widthStyled = this.column.widthStyled

    this.width = width

    if (this.element.style.width !== widthStyled) {
      this.element.style.width = widthStyled
    }
  }

  /**
   * Remove explicit width from the cell element.
   */
  clearWidth() {
    this.width = ''
    this.element.style.width = ''
  }

  /**
   * Get the computed cell width.
   * @returns {number|string}
   */
  getWidth() {
    if (this.width) {
      return this.width
    }

    return Math.max(this.element.offsetWidth, this.element.scrollWidth)
  }

  /**
   * Apply current column minimum width to the cell element.
   */
  setMinWidth() {
    const minWidth = this.column.minWidth
    const minWidthStyled = this.column.minWidthStyled

    this.minWidth = minWidth

    if (this.element.style.minWidth !== minWidthStyled) {
      this.element.style.minWidth = minWidthStyled
    }
  }

  /**
   * Apply current column maximum width to the cell element.
   */
  setMaxWidth() {
    const maxWidth = this.column.maxWidth
    const maxWidthStyled = this.column.maxWidthStyled

    this.maxWidth = maxWidth

    if (this.element.style.maxWidth !== maxWidthStyled) {
      this.element.style.maxWidth = maxWidthStyled
    }
  }

  /**
   * Trigger row height recalculation.
   */
  checkHeight() {
    // var height = this.element.css("height");
    this.row.reinitializeHeight()
  }

  /**
   * Clear any explicitly applied cell height.
   */
  clearHeight() {
    this.element.style.height = ''
    this.height = null

    this.dispatch('cell-height', this, '')
  }

  /**
   * Apply current row height to the cell element.
   */
  setHeight() {
    this.height = this.row.height
    this.element.style.height = this.row.heightStyled

    this.dispatch('cell-height', this, this.row.heightStyled)
  }

  /**
   * Get the computed cell height.
   * @returns {number}
   */
  getHeight() {
    return this.height || this.element.offsetHeight
  }

  /**
   * Show the cell element.
   */
  show() {
    this.element.classList.remove('tabulator-display-none')

    this.element.classList.toggle('tabulator-cell-inline-flex', !!this.column.vertAlign)
  }

  /**
   * Hide the cell element.
   */
  hide() {
    this.element.classList.add('tabulator-display-none')
  }

  /**
   * Remove the cell and clean up row/column references.
   */
  delete() {
    this.dispatch('cell-delete', this)

    if (!this.table.rowManager.redrawBlock && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }

    this.element = null
    this.column.deleteCell(this)
    this.row.deleteCell(this)
  }

  /**
   * Get the index of this cell in its row.
   * @returns {number}
   */
  getIndex() {
    return this.row.getCellIndex(this)
  }

  /// ///////////// Object Generation /////////////////
  /**
   * Get or lazily create the public cell component wrapper.
   * @returns {CellComponent}
   */
  getComponent() {
    if (!this.component) {
      this.component = new CellComponent(this)
    }

    return this.component
  }
}
