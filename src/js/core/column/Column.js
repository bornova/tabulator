import CoreFeature from '../CoreFeature.js'
import ColumnComponent from './ColumnComponent.js'
import defaultOptions from './defaults/options.js'

import Cell from '../cell/Cell.js'

export default class Column extends CoreFeature {
  static defaultOptionList = defaultOptions

  /**
   * @param {object} def Column definition.
   * @param {object} parent Parent column manager or column group.
   * @param {boolean} [rowHeader] Whether this column is the row header.
   */
  constructor(def, parent, rowHeader) {
    super(parent.table)

    this.definition = def // column definition
    this.parent = parent // hold parent object
    this.type = 'column' // type of element
    this.columns = [] // child columns
    this.cells = [] // cells bound to this column
    this.isGroup = false
    this.isRowHeader = rowHeader
    this.element = this.createElement() // column header element
    this.contentElement = false
    this.titleHolderElement = false
    this.titleElement = false
    this.groupElement = this.createGroupElement() // column group holder element
    this.hozAlign = '' // horizontal text alignment
    this.vertAlign = '' // vert text alignment

    // multi dimensional filed handling
    this.field = ''
    this.fieldStructure = ''
    this.getFieldValue = ''
    this.setFieldValue = ''

    this.titleDownload = null
    this.titleFormatterRendered = false

    this.mapDefinitions()

    this.setField(this.definition.field)

    this.modules = {} // hold module variables;

    this.width = null // column width
    this.widthStyled = '' // column width pre-styled to improve render efficiency
    this.maxWidth = null // column maximum width
    this.maxWidthStyled = '' // column maximum pre-styled to improve render efficiency
    this.maxInitialWidth = null
    this.minWidth = null // column minimum width
    this.minWidthStyled = '' // column minimum pre-styled to improve render efficiency
    this.widthFixed = false // user has specified a width for this column

    this.visible = true // default visible state

    this.component = null

    // initialize column
    if (this.definition.columns) {
      this.isGroup = true

      this.definition.columns.forEach((def) => {
        const newCol = new Column(def, this)
        this.attachColumn(newCol)
      })

      this.checkColumnVisibility()
    } else {
      parent.registerColumnField(this)
    }

    this._initialize()
  }

  /**
   * Create the header element for this column.
   * @returns {HTMLDivElement}
   */
  createElement() {
    const el = document.createElement('div')

    el.classList.add('tabulator-col')
    el.setAttribute('role', 'columnheader')
    el.setAttribute('aria-sort', 'none')

    if (this.isRowHeader) {
      el.classList.add('tabulator-row-header')
    }

    switch (this.table.options.columnHeaderVertAlign) {
      case 'middle':
        el.style.justifyContent = 'center'
        break
      case 'bottom':
        el.style.justifyContent = 'flex-end'
        break
    }

    return el
  }

  /**
   * Create the element that contains group child columns.
   * @returns {HTMLDivElement}
   */
  createGroupElement() {
    const el = document.createElement('div')

    el.classList.add('tabulator-col-group-cols')

    return el
  }

  /**
   * Merge defaults and generate normalized definition options.
   */
  mapDefinitions() {
    const defaults = this.table.options.columnDefaults
    const definition = { ...this.definition }

    // map columnDefaults onto column definitions
    if (defaults) {
      Object.entries(defaults).forEach(([key, value]) => {
        if (definition[key] === undefined) {
          definition[key] = value
        }
      })
    }

    this.definition = this.table.columnManager.optionsList.generate(Column.defaultOptionList, definition)
  }

  /**
   * Validate definition keys against known column options.
   */
  checkDefinition() {
    Object.keys(this.definition).forEach((key) => {
      if (!Column.defaultOptionList.includes(key)) {
        console.warn("Invalid column definition option in '" + (this.field || this.definition.title) + "' column:", key)
      }
    })
  }

  /**
   * Set field access strategy for this column.
   * @param {string} field Column field path.
   */
  setField(field) {
    this.field = field
    this.fieldStructure = field
      ? this.table.options.nestedFieldSeparator
        ? field.split(this.table.options.nestedFieldSeparator)
        : [field]
      : []
    this.getFieldValue = this.fieldStructure.length > 1 ? this._getNestedData : this._getFlatData
    this.setFieldValue = this.fieldStructure.length > 1 ? this._setNestedData : this._setFlatData
  }

  /**
   * Register column position with the parent manager.
   * @param {Column} column Column instance.
   */
  registerColumnPosition(column) {
    this.parent.registerColumnPosition(column)
  }

  /**
   * Register column field with the parent manager.
   * @param {Column} column Column instance.
   */
  registerColumnField(column) {
    this.parent.registerColumnField(column)
  }

  /**
   * Trigger position registration recursively for child columns.
   */
  reRegisterPosition() {
    if (this.isGroup) {
      this.columns.forEach((column) => {
        column.reRegisterPosition()
      })
    } else {
      this.registerColumnPosition(this)
    }
  }

  /**
   * Build and initialize the header element.
   */
  _initialize() {
    const def = this.definition

    this.element.replaceChildren()

    if (def.headerVertical) {
      this.element.classList.add('tabulator-col-vertical')

      if (def.headerVertical === 'flip') {
        this.element.classList.add('tabulator-col-vertical-flip')
      }
    }

    this.contentElement = this._buildColumnHeaderContent()

    this.element.appendChild(this.contentElement)

    if (this.isGroup) {
      this._buildGroupHeader()
    } else {
      this._buildColumnHeader()
    }

    this.dispatch('column-init', this)
  }

  /**
   * Build header details for a non-group column.
   */
  _buildColumnHeader() {
    const def = this.definition

    this.dispatch('column-layout', this)

    // set column visibility
    if (def.visible !== undefined) {
      if (def.visible) {
        this.show(true)
      } else {
        this.hide(true)
      }
    }

    // assign additional css classes to column header
    if (def.cssClass) {
      const classNames = def.cssClass.split(/\s+/).filter(Boolean)

      classNames.forEach((className) => {
        this.element.classList.add(className)
      })
    }

    if (def.field) {
      this.element.setAttribute('tabulator-field', def.field)
    }

    // set min width if present
    this.setMinWidth(parseInt(def.minWidth))

    if (def.maxInitialWidth) {
      this.maxInitialWidth = parseInt(def.maxInitialWidth)
    }

    if (def.maxWidth) {
      this.setMaxWidth(parseInt(def.maxWidth))
    }

    this.reinitializeWidth()

    // set horizontal text alignment
    this.hozAlign = this.definition.hozAlign
    this.vertAlign = this.definition.vertAlign

    this.titleElement.style.textAlign = this.definition.headerHozAlign
  }

  /**
   * Build the column header content wrapper and title holder.
   * @returns {HTMLDivElement}
   */
  _buildColumnHeaderContent() {
    const contentElement = document.createElement('div')

    contentElement.classList.add('tabulator-col-content')

    this.titleHolderElement = document.createElement('div')
    this.titleHolderElement.classList.add('tabulator-col-title-holder')

    contentElement.appendChild(this.titleHolderElement)

    this.titleElement = this._buildColumnHeaderTitle()

    this.titleHolderElement.appendChild(this.titleElement)

    return contentElement
  }

  /**
   * Build the title element for the column header.
   * @returns {HTMLDivElement}
   */
  _buildColumnHeaderTitle() {
    const def = this.definition
    const titleHolderElement = document.createElement('div')

    titleHolderElement.classList.add('tabulator-col-title')

    if (def.headerWordWrap) {
      titleHolderElement.classList.add('tabulator-col-title-wrap')
    }

    if (def.editableTitle) {
      const titleElement = document.createElement('input')

      titleElement.classList.add('tabulator-title-editor')

      titleElement.addEventListener('click', (e) => {
        e.stopPropagation()
        titleElement.focus()
      })

      titleElement.addEventListener('mousedown', (e) => {
        e.stopPropagation()
      })

      titleElement.addEventListener('change', () => {
        def.title = titleElement.value
        this.dispatchExternal('columnTitleChanged', this.getComponent())
      })

      titleHolderElement.appendChild(titleElement)

      if (def.field) {
        this.langBind('columns|' + def.field, (text) => {
          titleElement.value = text || def.title || '&nbsp;'
        })
      } else {
        titleElement.value = def.title || '&nbsp;'
      }
    } else {
      if (def.field) {
        this.langBind('columns|' + def.field, (text) => {
          this._formatColumnHeaderTitle(titleHolderElement, text || def.title || '&nbsp;')
        })
      } else {
        this._formatColumnHeaderTitle(titleHolderElement, def.title || '&nbsp;')
      }
    }

    return titleHolderElement
  }

  /**
   * Format and apply column header title content.
   * @param {HTMLElement} el Target title element.
   * @param {string} title Title text.
   */
  _formatColumnHeaderTitle(el, title) {
    const contents = this.chain('column-format', [this, title, el], null, () => title)

    switch (typeof contents) {
      case 'object':
        if (contents instanceof Node) {
          el.replaceChildren(contents)
        } else {
          el.innerHTML = ''
          console.warn(
            'Format Error - Title formatter has returned a type of object, the only valid formatter object return is an instance of Node, the formatter returned:',
            contents
          )
        }
        break
      case 'undefined':
        el.innerHTML = ''
        break
      default:
        el.innerHTML = contents
    }
  }

  /**
   * Build header details for a grouped column.
   */
  _buildGroupHeader() {
    this.element.classList.add('tabulator-col-group')
    this.element.setAttribute('role', 'columngroup')
    this.element.setAttribute('aria-title', this.definition.title)

    // asign additional css classes to column header
    if (this.definition.cssClass) {
      const classNames = this.definition.cssClass.split(/\s+/).filter(Boolean)
      classNames.forEach((className) => {
        this.element.classList.add(className)
      })
    }

    this.titleElement.style.textAlign = this.definition.headerHozAlign

    this.element.appendChild(this.groupElement)
  }

  /**
   * Get a value from a flat data object using this column field.
   * @param {object} data Row data object.
   * @returns {*}
   */
  _getFlatData(data) {
    return data[this.field]
  }

  /**
   * Get a value from nested row data using the field structure.
   * @param {object} data Row data object.
   * @returns {*}
   */
  _getNestedData(data) {
    const structure = this.fieldStructure
    const length = structure.length

    let dataObj = data
    let output

    for (let i = 0; i < length; i++) {
      dataObj = dataObj[structure[i]]

      output = dataObj

      if (!dataObj) {
        break
      }
    }

    return output
  }

  /**
   * Set a value on a flat data object.
   * @param {object} data Row data object.
   * @param {*} value Value to set.
   */
  _setFlatData(data, value) {
    if (this.field) {
      data[this.field] = value
    }
  }

  /**
   * Set a value on nested row data using the field structure.
   * @param {object} data Row data object.
   * @param {*} value Value to set.
   */
  _setNestedData(data, value) {
    const structure = this.fieldStructure
    const length = structure.length

    let dataObj = data

    for (let i = 0; i < length; i++) {
      if (i === length - 1) {
        dataObj[structure[i]] = value
      } else {
        if (!dataObj[structure[i]]) {
          if (value !== undefined) {
            dataObj[structure[i]] = {}
          } else {
            break
          }
        }

        dataObj = dataObj[structure[i]]
      }
    }
  }

  /**
   * Attach a child column to this group column.
   * @param {Column} column Child column.
   */
  attachColumn(column) {
    if (this.groupElement) {
      this.columns.push(column)
      this.groupElement.appendChild(column.getElement())

      column.columnRendered()
    } else {
      console.warn('Column Warning - Column being attached to another column instead of column group')
    }
  }

  /**
   * Apply vertical alignment and height to this column header.
   * @param {string} alignment Vertical alignment mode.
   * @param {number} [height] Optional explicit parent header height.
   */
  verticalAlign(alignment, height) {
    // calculate height of column header and group holder element
    const parentHeight = this.parent.isGroup
      ? this.parent.getGroupElement().clientHeight
      : height || this.parent.getHeadersElement().clientHeight
    // var parentHeight = this.parent.isGroup ? this.parent.getGroupElement().clientHeight : this.parent.getHeadersElement().clientHeight;

    this.element.style.height = `${parentHeight}px`

    this.dispatch('column-height', this, this.element.style.height)

    if (this.isGroup) {
      this.groupElement.style.minHeight = `${parentHeight - this.contentElement.offsetHeight}px`
    }

    // vertically align cell contents
    // if(!this.isGroup && alignment !== "top"){
    // 	if(alignment === "bottom"){
    // 		this.element.style.paddingTop = (this.element.clientHeight - this.contentElement.offsetHeight) + "px";
    // 	}else{
    // 		this.element.style.paddingTop = ((this.element.clientHeight - this.contentElement.offsetHeight) / 2) + "px";
    // 	}
    // }

    this.columns.forEach((column) => {
      column.verticalAlign(alignment)
    })
  }

  /**
   * Clear vertical alignment and related sizing styles.
   */
  clearVerticalAlign() {
    this.element.style.paddingTop = ''
    this.element.style.height = ''
    this.element.style.minHeight = ''
    this.groupElement.style.minHeight = ''

    this.columns.forEach((column) => {
      column.clearVerticalAlign()
    })

    this.dispatch('column-height', this, '')
  }

  /// / Retrieve Column Information ////
  /**
   * Return the header element.
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this.element
  }

  /**
   * Return the group child container element.
   * @returns {HTMLElement|null}
   */
  getGroupElement() {
    return this.groupElement
  }

  /**
   * Return the column field.
   * @returns {string}
   */
  getField() {
    return this.field
  }

  /**
   * Return the title text used during downloads.
   * @returns {string|null}
   */
  getTitleDownload() {
    return this.titleDownload
  }

  /**
   * Return the first leaf column in this group.
   * @returns {Column|boolean}
   */
  getFirstColumn() {
    return !this.isGroup ? this : this.columns.length ? this.columns[0].getFirstColumn() : false
  }

  /**
   * Return the last leaf column in this group.
   * @returns {Column|boolean}
   */
  getLastColumn() {
    return !this.isGroup ? this : this.columns.length ? this.columns[this.columns.length - 1].getLastColumn() : false
  }

  /**
   * Return all child columns or a flattened tree.
   * @param {boolean} [traverse] Include nested descendants when true.
   * @returns {Array<Column>}
   */
  getColumns(traverse) {
    let columns = []

    if (traverse) {
      this.columns.forEach((column) => {
        columns.push(column)

        columns = columns.concat(column.getColumns(true))
      })
    } else {
      columns = this.columns
    }

    return columns
  }

  /**
   * Return all cells mapped to this column.
   * @returns {Array<Cell>}
   */
  getCells() {
    return this.cells
  }

  /**
   * Retrieve the top-most parent column in this group hierarchy.
   * @returns {Column}
   */
  getTopColumn() {
    if (this.parent.isGroup) {
      return this.parent.getTopColumn()
    } else {
      return this
    }
  }

  /**
   * Return the definition for this column.
   * @param {boolean} [updateBranches] Refresh grouped child definitions when true.
   * @returns {object}
   */
  getDefinition(updateBranches) {
    const colDefs = []

    if (this.isGroup && updateBranches) {
      this.columns.forEach((column) => {
        colDefs.push(column.getDefinition(true))
      })

      this.definition.columns = colDefs
    }

    return this.definition
  }

  /// ///////////////// Actions ////////////////////
  /**
   * Update group visibility state based on child visibility.
   */
  checkColumnVisibility() {
    const visible = this.columns.some((column) => column.visible)

    if (visible) {
      this.show()
      this.dispatchExternal('columnVisibilityChanged', this.getComponent(), false)
    } else {
      this.hide()
    }
  }

  /**
   * Show this column.
   * @param {boolean} [silent] Suppress external visibility event when true.
   * @param {boolean} [responsiveToggle] Visibility change caused by responsive module.
   */
  show(silent, responsiveToggle) {
    if (!this.visible) {
      this.visible = true

      this.element.classList.remove('tabulator-display-none')

      if (this.parent.isGroup) {
        this.parent.checkColumnVisibility()
      }

      this.cells.forEach((cell) => {
        cell.show()
      })

      if (!this.isGroup && this.width === null) {
        this.reinitializeWidth()
      }

      this.table.columnManager.verticalAlignHeaders()

      this.dispatch('column-show', this, responsiveToggle)

      if (!silent) {
        this.dispatchExternal('columnVisibilityChanged', this.getComponent(), true)
      }

      if (this.parent.isGroup) {
        this.parent.matchChildWidths()
      }

      if (!this.silent) {
        this.table.columnManager.rerenderColumns()
      }
    }
  }

  /**
   * Hide this column.
   * @param {boolean} [silent] Suppress external visibility event when true.
   * @param {boolean} [responsiveToggle] Visibility change caused by responsive module.
   */
  hide(silent, responsiveToggle) {
    if (this.visible) {
      this.visible = false

      this.element.classList.add('tabulator-display-none')

      this.table.columnManager.verticalAlignHeaders()

      if (this.parent.isGroup) {
        this.parent.checkColumnVisibility()
      }

      this.cells.forEach((cell) => {
        cell.hide()
      })

      this.dispatch('column-hide', this, responsiveToggle)

      if (!silent) {
        this.dispatchExternal('columnVisibilityChanged', this.getComponent(), false)
      }

      if (this.parent.isGroup) {
        this.parent.matchChildWidths()
      }

      if (!this.silent) {
        this.table.columnManager.rerenderColumns()
      }
    }
  }

  /**
   * Recompute grouped column width based on visible child widths.
   */
  matchChildWidths() {
    let childWidth = 0

    if (this.contentElement && this.columns.length) {
      this.columns.forEach((column) => {
        if (column.visible) {
          childWidth += column.getWidth()
        }
      })

      const maxWidth = `${childWidth - 1}px`

      if (this.contentElement.style.maxWidth !== maxWidth) {
        this.contentElement.style.maxWidth = maxWidth
      }

      if (this.table.initialized) {
        const width = `${childWidth}px`

        if (this.element.style.width !== width) {
          this.element.style.width = width
        }
      }

      if (this.parent.isGroup) {
        this.parent.matchChildWidths()
      }
    }
  }

  /**
   * Remove a child column from this group.
   * @param {Column} child Child column.
   */
  removeChild(child) {
    const index = this.columns.indexOf(child)

    if (index > -1) {
      this.columns.splice(index, 1)
    }

    if (!this.columns.length) {
      this.delete()
    }
  }

  /**
   * Set explicit width on this column.
   * @param {number|string} width Width value in pixels or percentage.
   */
  setWidth(width) {
    this.widthFixed = true
    this.setWidthActual(width)
  }

  /**
   * Apply width constraints and update related cell widths.
   * @param {number|string} width Width value in pixels or percentage.
   */
  setWidthActual(width) {
    if (Number.isNaN(Number(width))) {
      width = Math.floor((this.table.element.clientWidth / 100) * Number.parseInt(width, 10))
    }

    width = Math.max(this.minWidth, width)

    if (this.maxWidth) {
      width = Math.min(this.maxWidth, width)
    }

    this.width = width
    this.widthStyled = width ? width + 'px' : ''

    if (this.element.style.width !== this.widthStyled) {
      this.element.style.width = this.widthStyled
    }

    if (!this.isGroup) {
      this.cells.forEach((cell) => {
        cell.setWidth()
      })
    }

    if (this.parent.isGroup) {
      this.parent.matchChildWidths()
    }

    this.dispatch('column-width', this)

    if (this.subscribedExternal('columnWidth')) {
      this.dispatchExternal('columnWidth', this.getComponent())
    }
  }

  /**
   * Recalculate row heights for rows bound to this column.
   */
  checkCellHeights() {
    const rows = []

    this.cells.forEach((cell) => {
      if (cell.row.heightInitialized) {
        if (cell.row.getElement().offsetParent !== null) {
          rows.push(cell.row)
          cell.row.clearCellHeight()
        } else {
          cell.row.heightInitialized = false
        }
      }
    })

    rows.forEach((row) => {
      row.calcHeight()
    })

    rows.forEach((row) => {
      row.setCellHeight()
    })
  }

  /**
   * Return computed width for this column or group.
   * @returns {number}
   */
  getWidth() {
    let width = 0

    if (this.isGroup) {
      this.columns.forEach((column) => {
        if (column.visible) {
          width += column.getWidth()
        }
      })
    } else {
      width = this.width
    }

    return width
  }

  /**
   * Return cumulative left offset of this column.
   * @returns {number}
   */
  getLeftOffset() {
    let offset = this.element.offsetLeft

    if (this.parent.isGroup) {
      offset += this.parent.getLeftOffset()
    }

    return offset
  }

  /**
   * Return rendered column height.
   * @returns {number}
   */
  getHeight() {
    return Math.ceil(this.element.getBoundingClientRect().height)
  }

  /**
   * Set minimum width constraint.
   * @param {number} minWidth Minimum width in pixels.
   */
  setMinWidth(minWidth) {
    if (this.maxWidth && minWidth > this.maxWidth) {
      minWidth = this.maxWidth

      console.warn(
        'the minWidth (' +
          minWidth +
          "px) for column '" +
          this.field +
          "' cannot be bigger that its maxWidth (" +
          this.maxWidthStyled +
          ')'
      )
    }

    this.minWidth = minWidth
    this.minWidthStyled = minWidth ? minWidth + 'px' : ''

    if (this.element.style.minWidth !== this.minWidthStyled) {
      this.element.style.minWidth = this.minWidthStyled
    }

    this.cells.forEach((cell) => {
      cell.setMinWidth()
    })
  }

  /**
   * Set maximum width constraint.
   * @param {number} maxWidth Maximum width in pixels.
   */
  setMaxWidth(maxWidth) {
    if (this.minWidth && maxWidth < this.minWidth) {
      maxWidth = this.minWidth

      console.warn(
        'the maxWidth (' +
          maxWidth +
          "px) for column '" +
          this.field +
          "' cannot be smaller that its minWidth (" +
          this.minWidthStyled +
          ')'
      )
    }

    this.maxWidth = maxWidth
    this.maxWidthStyled = maxWidth ? maxWidth + 'px' : ''

    if (this.element.style.maxWidth !== this.maxWidthStyled) {
      this.element.style.maxWidth = this.maxWidthStyled
    }

    this.cells.forEach((cell) => {
      cell.setMaxWidth()
    })
  }

  /**
   * Delete the column and all bound cells.
   * @returns {Promise<void>}
   */
  delete() {
    return new Promise((resolve) => {
      if (this.isGroup) {
        this.columns.forEach((column) => {
          column.delete()
        })
      }

      this.dispatch('column-delete', this)

      const cellCount = this.cells.length

      for (let i = 0; i < cellCount; i++) {
        this.cells[0].delete()
      }

      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element)
      }

      this.element = null
      this.contentElement = null
      this.titleElement = null
      this.groupElement = null

      if (this.parent.isGroup) {
        this.parent.removeChild(this)
      }

      this.table.columnManager.deregisterColumn(this)

      this.table.columnManager.rerenderColumns(true)

      this.dispatch('column-deleted', this)

      resolve()
    })
  }

  /**
   * Dispatch render-complete hooks for this column.
   */
  columnRendered() {
    if (this.titleFormatterRendered) {
      this.titleFormatterRendered()
    }

    this.dispatch('column-rendered', this)
  }

  /// ///////////// Cell Management /////////////////
  /**
   * Generate and register a cell for this column.
   * @param {object} row Internal row instance.
   * @returns {Cell}
   */
  generateCell(row) {
    const cell = new Cell(this, row)

    this.cells.push(cell)

    return cell
  }

  /**
   * Get the next visible column.
   * @returns {Column|boolean}
   */
  nextColumn() {
    const index = this.table.columnManager.findColumnIndex(this)
    return index > -1 ? this._nextVisibleColumn(index + 1) : false
  }

  /**
   * Find next visible column from a starting index.
   * @param {number} index Start index.
   * @returns {Column|undefined}
   */
  _nextVisibleColumn(index) {
    const column = this.table.columnManager.getColumnByIndex(index)
    return !column || column.visible ? column : this._nextVisibleColumn(index + 1)
  }

  /**
   * Get the previous visible column.
   * @returns {Column|boolean}
   */
  prevColumn() {
    const index = this.table.columnManager.findColumnIndex(this)
    return index > -1 ? this._prevVisibleColumn(index - 1) : false
  }

  /**
   * Find previous visible column from a starting index.
   * @param {number} index Start index.
   * @returns {Column|undefined}
   */
  _prevVisibleColumn(index) {
    const column = this.table.columnManager.getColumnByIndex(index)
    return !column || column.visible ? column : this._prevVisibleColumn(index - 1)
  }

  /**
   * Reinitialize width state and refit to content.
   * @param {boolean} [force] Force width handling regardless of explicit width settings.
   */
  reinitializeWidth(force) {
    this.widthFixed = false

    // set width if present
    if (this.definition.width !== undefined && !force) {
      // maxInitialWidth ignored here as width specified
      this.setWidth(this.definition.width)
    }

    this.dispatch('column-width-fit-before', this)

    this.fitToData(force)

    this.dispatch('column-width-fit-after', this)
  }

  /**
   * Resize this column to fit content width.
   * @param {boolean} [force] Force width application.
   */
  fitToData(force) {
    if (this.isGroup) {
      return
    }

    if (!this.widthFixed) {
      this.element.style.width = ''

      this.cells.forEach((cell) => {
        cell.clearWidth()
      })
    }

    let maxWidth = this.element.offsetWidth

    if (!this.width || !this.widthFixed) {
      this.cells.forEach((cell) => {
        const width = cell.getWidth()

        if (width > maxWidth) {
          maxWidth = width
        }
      })

      if (maxWidth) {
        let setTo = maxWidth + 1

        if (force) {
          this.setWidth(setTo)
        } else {
          if (this.maxInitialWidth && !force) {
            setTo = Math.min(setTo, this.maxInitialWidth)
          }
          this.setWidthActual(setTo)
        }
      }
    }
  }

  /**
   * Update definition by replacing this column with a regenerated one.
   * @param {object} updates Partial definition updates.
   * @returns {Promise<object>}
   */
  async updateDefinition(updates) {
    let definition

    if (!this.isGroup) {
      if (!this.parent.isGroup) {
        definition = {
          ...this.getDefinition(),
          ...updates
        }

        return this.table.columnManager.addColumn(definition, false, this).then((column) => {
          if (definition.field === this.field) {
            this.field = false // clear field name to prevent deletion of duplicate column from arrays
          }

          return this.delete().then(() => column.getComponent())
        })
      } else {
        console.error('Column Update Error - The updateDefinition function is only available on ungrouped columns')
        return Promise.reject(
          'Column Update Error - The updateDefinition function is only available on columns, not column groups'
        )
      }
    } else {
      console.error('Column Update Error - The updateDefinition function is only available on ungrouped columns')
      return Promise.reject(
        'Column Update Error - The updateDefinition function is only available on columns, not column groups'
      )
    }
  }

  /**
   * Remove a cell from this column's cell collection.
   * @param {Cell} cell Cell instance.
   */
  deleteCell(cell) {
    const index = this.cells.indexOf(cell)

    if (index > -1) {
      this.cells.splice(index, 1)
    }
  }

  /// ///////////// Object Generation /////////////////
  /**
   * Get or lazily create the public column component.
   * @returns {ColumnComponent}
   */
  getComponent() {
    if (!this.component) {
      this.component = new ColumnComponent(this)
    }

    return this.component
  }

  /**
   * Return visible position (1-based) among currently visible columns.
   * @returns {number}
   */
  getPosition() {
    return this.table.columnManager.getVisibleColumnsByIndex().indexOf(this) + 1
  }

  /**
   * Return parent column component when nested in a group.
   * @returns {object|boolean}
   */
  getParentComponent() {
    return this.parent instanceof Column ? this.parent.getComponent() : false
  }
}
