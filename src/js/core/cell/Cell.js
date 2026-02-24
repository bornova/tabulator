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
    this.deleted = false

    this.loaded = false // track if the cell has been added to the DOM yet

    this.build()
  }

  /// ///////////// Setup Functions /////////////////
  /**
   * Build the cell element and initialize its value.
   * @returns {void}
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
   * @returns {void}
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
   * @returns {void}
   */
  _configureCell() {
    const element = this.element
    const field = this.column.getField()

    // set text alignment
    this._setStyleValue('textAlign', this.column.hozAlign)

    if (this.column.vertAlign) {
      this._setStyleValue('display', this._getDisplayValue())

      this._setStyleValue('alignItems', VERTICAL_ALIGN_TO_FLEX[this.column.vertAlign] || '')

      if (this.column.hozAlign) {
        this._setStyleValue('justifyContent', HORIZONTAL_ALIGN_TO_FLEX[this.column.hozAlign] || '')
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
   * @returns {void}
   */
  _generateContents() {
    const val = this.chain('cell-format', this, null, () => {
      this.element.textContent = this.value
      return this.element.textContent
    })

    this._applyFormattedValue(val)
  }

  /**
   * Apply formatter output to the cell element.
   * @param {*} val Formatter output.
   * @returns {void}
   */
  _applyFormattedValue(val) {
    if (typeof val === 'object') {
      if (val instanceof Node) {
        this.element.replaceChildren(val)
        return
      }

      if (val != null) {
        console.warn(
          'Format Error - Formatter has returned a type of object, the only valid formatter object return is an instance of Node, the formatter returned:',
          val
        )
      }

      val = ''
    } else if (typeof val === 'undefined') {
      val = ''
    }

    this.element.innerHTML = val
  }

  /**
   * Dispatch the rendered hook for the cell.
   * @returns {void}
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
   * @returns {void}
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
    const changed = this.value !== value || force

    if (changed && mutate) {
      value = this.chain('cell-value-changing', [this, value], null, value)
    }

    if (changed) {
      this.setValueActual(value)
      this.dispatch('cell-value-changed', this)
    }

    return changed
  }

  /**
   * Persist the value onto row data and update rendered content when needed.
   * @param {*} value New value.
   * @returns {void}
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
   * @returns {void}
   */
  layoutElement() {
    this._generateContents()

    this.dispatch('cell-layout', this)
  }

  /**
   * Apply current column width to the cell element.
   * @returns {void}
   */
  setWidth() {
    const width = this.column.width
    const widthStyled = this.column.widthStyled

    this.width = width

    this._setStyleValue('width', widthStyled)
  }

  /**
   * Remove explicit width from the cell element.
   * @returns {void}
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
   * @returns {void}
   */
  setMinWidth() {
    const minWidth = this.column.minWidth
    const minWidthStyled = this.column.minWidthStyled

    this.minWidth = minWidth

    this._setStyleValue('minWidth', minWidthStyled)
  }

  /**
   * Apply current column maximum width to the cell element.
   * @returns {void}
   */
  setMaxWidth() {
    const maxWidth = this.column.maxWidth
    const maxWidthStyled = this.column.maxWidthStyled

    this.maxWidth = maxWidth

    this._setStyleValue('maxWidth', maxWidthStyled)
  }

  /**
   * Trigger row height recalculation.
   * @returns {void}
   */
  checkHeight() {
    // var height = this.element.css("height");
    this.row.reinitializeHeight()
  }

  /**
   * Clear any explicitly applied cell height.
   * @returns {void}
   */
  clearHeight() {
    this.element.style.height = ''
    this.height = null

    this.dispatch('cell-height', this, '')
  }

  /**
   * Apply current row height to the cell element.
   * @returns {void}
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
   * @returns {void}
   */
  show() {
    this._setStyleValue('display', this._getDisplayValue())
  }

  /**
   * Hide the cell element.
   * @returns {void}
   */
  hide() {
    this._setStyleValue('display', 'none')
  }

  /**
   * Remove the cell and clean up row/column references.
   * @returns {void}
   */
  delete() {
    if (this.deleted) {
      return
    }

    this.deleted = true

    this.dispatch('cell-delete', this)

    if (!this.table.rowManager.redrawBlock && this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }

    this.element = null
    this.column.deleteCell(this)
    this.row.deleteCell(this)
  }

  /**
   * Compute the default display mode for a visible cell.
   * @returns {string}
   */
  _getDisplayValue() {
    return this.column.vertAlign ? 'inline-flex' : ''
  }

  /**
   * Set a style property only when the value differs.
   * @param {keyof CSSStyleDeclaration|string} property Style property name.
   * @param {string} value Style value.
   * @returns {void}
   */
  _setStyleValue(property, value) {
    if (this.element.style[property] !== value) {
      this.element.style[property] = value
    }
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
