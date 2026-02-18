import CoreFeature from './CoreFeature.js'
import Column from './column/Column.js'
import ColumnComponent from './column/ColumnComponent.js'
import Helpers from './tools/Helpers.js'
import OptionsList from './tools/OptionsList.js'

import RendererBasicHorizontal from './rendering/renderers/BasicHorizontal.js'
import RendererVirtualDomHorizontal from './rendering/renderers/VirtualDomHorizontal.js'

import defaultColumnOptions from './column/defaults/options.js'

export default class ColumnManager extends CoreFeature {
  constructor(table) {
    super(table)

    this.blockHozScrollEvent = false
    this.headersElement = null
    this.contentsElement = null
    this.rowHeader = null
    this.element = null // containing element
    this.columns = [] // column definition object
    this.columnsByIndex = [] // columns by index
    this.columnsByField = {} // columns by field
    this.scrollLeft = 0
    this.optionsList = new OptionsList(this.table, 'column definition', defaultColumnOptions)

    this.redrawBlock = false // prevent redraws to allow multiple data manipulations before continuing
    this.redrawBlockUpdate = null // store latest redraw update only status

    this.renderer = null
  }

  /// /////////// Setup Functions /////////////////

  initialize() {
    this.initializeRenderer()

    this.headersElement = this.createHeadersElement()
    this.contentsElement = this.createHeaderContentsElement()
    this.element = this.createHeaderElement()

    this.contentsElement.insertBefore(this.headersElement, this.contentsElement.firstChild)
    this.element.insertBefore(this.contentsElement, this.element.firstChild)

    this.initializeScrollWheelWatcher()

    this.subscribe('scroll-horizontal', this.scrollHorizontal.bind(this))
    this.subscribe('scrollbar-vertical', this.padVerticalScrollbar.bind(this))
  }

  padVerticalScrollbar(width) {
    if (this.table.rtl) {
      this.headersElement.style.marginLeft = `${width}px`
    } else {
      this.headersElement.style.marginRight = `${width}px`
    }
  }

  initializeRenderer() {
    let renderClass

    const renderers = {
      virtual: RendererVirtualDomHorizontal,
      basic: RendererBasicHorizontal
    }

    if (typeof this.table.options.renderHorizontal === 'string') {
      renderClass = renderers[this.table.options.renderHorizontal]
    } else {
      renderClass = this.table.options.renderHorizontal
    }

    if (renderClass) {
      this.renderer = new renderClass(this.table, this.element, this.tableElement)
      this.renderer.initialize()
    } else {
      console.error('Unable to find matching renderer:', this.table.options.renderHorizontal)
    }
  }

  createHeadersElement() {
    const element = document.createElement('div')

    element.classList.add('tabulator-headers')
    element.setAttribute('role', 'row')

    return element
  }

  createHeaderContentsElement() {
    const element = document.createElement('div')

    element.classList.add('tabulator-header-contents')
    element.setAttribute('role', 'rowgroup')

    return element
  }

  createHeaderElement() {
    const element = document.createElement('div')

    element.classList.add('tabulator-header')
    element.setAttribute('role', 'rowgroup')

    if (!this.table.options.headerVisible) {
      element.classList.add('tabulator-header-hidden')
    }

    return element
  }

  // return containing element
  getElement() {
    return this.element
  }

  // return containing contents element
  getContentsElement() {
    return this.contentsElement
  }

  // return header containing element
  getHeadersElement() {
    return this.headersElement
  }

  // scroll horizontally to match table body
  scrollHorizontal(left) {
    this.contentsElement.scrollLeft = left

    this.scrollLeft = left

    this.renderer.scrollColumns(left)
  }

  initializeScrollWheelWatcher() {
    this.contentsElement.addEventListener('wheel', (e) => {
      let left

      if (e.deltaX) {
        left = this.contentsElement.scrollLeft + e.deltaX

        this.table.rowManager.scrollHorizontal(left)
        this.table.columnManager.scrollHorizontal(left)
      }
    })
  }

  /// ////////// Column Setup Functions /////////////
  generateColumnsFromRowData(data) {
    const cols = []
    const collProgress = {}
    const rowSample = this.table.options.autoColumns === 'full' ? data : [data[0]]
    const definitions = this.table.options.autoColumnsDefinitions

    if (data && data.length) {
      rowSample.forEach((row) => {
        Object.keys(row).forEach((key, index) => {
          const value = row[key]
          let col

          if (!collProgress[key]) {
            col = {
              field: key,
              title: key,
              sorter: this.calculateSorterFromValue(value)
            }

            cols.splice(index, 0, col)
            collProgress[key] = typeof value === 'undefined' ? col : true
          } else if (collProgress[key] !== true) {
            if (typeof value !== 'undefined') {
              collProgress[key].sorter = this.calculateSorterFromValue(value)
              collProgress[key] = true
            }
          }
        })
      })

      if (definitions) {
        switch (typeof definitions) {
          case 'function':
            this.table.options.columns = definitions.call(this.table, cols)
            break

          case 'object':
            if (Array.isArray(definitions)) {
              cols.forEach((col) => {
                const match = definitions.find((def) => {
                  return def.field === col.field
                })

                if (match) {
                  Object.assign(col, match)
                }
              })
            } else {
              cols.forEach((col) => {
                if (definitions[col.field]) {
                  Object.assign(col, definitions[col.field])
                }
              })
            }

            this.table.options.columns = cols
            break
        }
      } else {
        this.table.options.columns = cols
      }

      this.setColumns(this.table.options.columns)
    }
  }

  calculateSorterFromValue(value) {
    let sorter

    switch (typeof value) {
      case 'undefined':
        sorter = 'string'
        break

      case 'boolean':
        sorter = 'boolean'
        break

      case 'number':
        sorter = 'number'
        break

      case 'object':
        if (Array.isArray(value)) {
          sorter = 'array'
        } else {
          sorter = 'string'
        }
        break

      default:
        if (!Number.isNaN(Number(value)) && value !== '') {
          sorter = 'number'
        } else {
          if (value.match(/((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+$/i)) {
            sorter = 'alphanum'
          } else {
            sorter = 'string'
          }
        }
        break
    }

    return sorter
  }

  setColumns(cols, row) {
    this.headersElement.replaceChildren()

    this.columns = []
    this.columnsByIndex = []
    this.columnsByField = {}

    this.dispatch('columns-loading')
    this.dispatchExternal('columnsLoading')

    if (this.table.options.rowHeader) {
      this.rowHeader = new Column(this.table.options.rowHeader === true ? {} : this.table.options.rowHeader, this, true)
      this.columns.push(this.rowHeader)
      this.headersElement.appendChild(this.rowHeader.getElement())
      this.rowHeader.columnRendered()
    }

    cols.forEach((def, i) => {
      this._addColumn(def)
    })

    this._reIndexColumns()

    this.dispatch('columns-loaded')

    if (this.subscribedExternal('columnsLoaded')) {
      this.dispatchExternal('columnsLoaded', this.getComponents())
    }

    this.rerenderColumns(false, true)

    this.redraw(true)
  }

  _addColumn(definition, before, nextToColumn) {
    const column = new Column(definition, this)
    const colEl = column.getElement()
    let index = nextToColumn ? this.findColumnIndex(nextToColumn) : nextToColumn

    // prevent adding of rows in front of row header
    if (before && this.rowHeader && (!nextToColumn || nextToColumn === this.rowHeader)) {
      before = false
      nextToColumn = this.rowHeader
      index = 0
    }

    if (nextToColumn && index > -1) {
      const topColumn = nextToColumn.getTopColumn()
      const parentIndex = this.columns.indexOf(topColumn)
      const nextEl = topColumn.getElement()

      if (before) {
        this.columns.splice(parentIndex, 0, column)
        nextEl.parentNode.insertBefore(colEl, nextEl)
      } else {
        this.columns.splice(parentIndex + 1, 0, column)
        nextEl.parentNode.insertBefore(colEl, nextEl.nextSibling)
      }
    } else {
      if (before) {
        this.columns.unshift(column)
        this.headersElement.insertBefore(column.getElement(), this.headersElement.firstChild)
      } else {
        this.columns.push(column)
        this.headersElement.appendChild(column.getElement())
      }
    }

    column.columnRendered()

    return column
  }

  registerColumnField(col) {
    if (col.definition.field) {
      this.columnsByField[col.definition.field] = col
    }
  }

  registerColumnPosition(col) {
    this.columnsByIndex.push(col)
  }

  _reIndexColumns() {
    this.columnsByIndex = []

    this.columns.forEach((column) => {
      column.reRegisterPosition()
    })
  }

  // ensure column headers take up the correct amount of space in column groups
  verticalAlignHeaders() {
    let minHeight = 0

    if (!this.redrawBlock) {
      this.headersElement.style.height = ''

      this.columns.forEach((column) => {
        column.clearVerticalAlign()
      })

      this.columns.forEach((column) => {
        const height = column.getHeight()

        if (height > minHeight) {
          minHeight = height
        }
      })

      this.headersElement.style.height = `${minHeight}px`

      this.columns.forEach((column) => {
        column.verticalAlign(this.table.options.columnHeaderVertAlign, minHeight)
      })

      this.table.rowManager.adjustTableSize()
    }
  }

  /// ///////////// Column Details /////////////////
  findColumn(subject) {
    let columns

    if (typeof subject === 'object') {
      if (subject instanceof Column) {
        // subject is column element
        return subject
      } else if (subject instanceof ColumnComponent) {
        // subject is public column component
        return subject._getSelf() || false
      } else if (typeof HTMLElement !== 'undefined' && subject instanceof HTMLElement) {
        columns = []

        this.columns.forEach((column) => {
          columns.push(column)
          columns = columns.concat(column.getColumns(true))
        })

        // subject is a HTML element of the column header
        const match = columns.find((column) => {
          return column.element === subject
        })

        return match || false
      }
    } else {
      // subject should be treated as the field name of the column
      return this.columnsByField[subject] || false
    }

    // catch all for any other type of input
    return false
  }

  getColumnByField(field) {
    return this.columnsByField[field]
  }

  getColumnsByFieldRoot(root) {
    const matches = []

    Object.keys(this.columnsByField).forEach((field) => {
      const fieldRoot = this.table.options.nestedFieldSeparator
        ? field.split(this.table.options.nestedFieldSeparator)[0]
        : field
      if (fieldRoot === root) {
        matches.push(this.columnsByField[field])
      }
    })

    return matches
  }

  getColumnByIndex(index) {
    return this.columnsByIndex[index]
  }

  getFirstVisibleColumn() {
    const index = this.columnsByIndex.findIndex((col) => {
      return col.visible
    })

    return index > -1 ? this.columnsByIndex[index] : false
  }

  getVisibleColumnsByIndex() {
    return this.columnsByIndex.filter((col) => col.visible)
  }

  getColumns() {
    return this.columns
  }

  findColumnIndex(column) {
    return this.columnsByIndex.findIndex((col) => column === col)
  }

  // return all columns that are not groups
  getRealColumns() {
    return this.columnsByIndex
  }

  // traverse across columns and call action
  traverse(callback) {
    this.columnsByIndex.forEach(callback)
  }

  // get definitions of actual columns
  getDefinitions(active) {
    const output = []

    this.columnsByIndex.forEach((column) => {
      if (!active || (active && column.visible)) {
        output.push(column.getDefinition())
      }
    })

    return output
  }

  // get full nested definition tree
  getDefinitionTree() {
    return this.columns.map((column) => column.getDefinition(true))
  }

  getComponents(structured) {
    const columns = structured ? this.columns : this.columnsByIndex

    return columns.map((column) => column.getComponent())
  }

  getWidth() {
    let width = 0

    this.columnsByIndex.forEach((column) => {
      if (column.visible) {
        width += column.getWidth()
      }
    })

    return width
  }

  moveColumn(from, to, after) {
    to.element.parentNode.insertBefore(from.element, to.element)

    if (after) {
      to.element.parentNode.insertBefore(to.element, from.element)
    }

    this.moveColumnActual(from, to, after)

    this.verticalAlignHeaders()

    this.table.rowManager.reinitialize()
  }

  moveColumnActual(from, to, after) {
    if (from.parent.isGroup) {
      this._moveColumnInArray(from.parent.columns, from, to, after)
    } else {
      this._moveColumnInArray(this.columns, from, to, after)
    }

    this._moveColumnInArray(this.columnsByIndex, from, to, after, true)

    this.rerenderColumns(true)

    this.dispatch('column-moved', from, to, after)

    if (this.subscribedExternal('columnMoved')) {
      this.dispatchExternal('columnMoved', from.getComponent(), this.table.columnManager.getComponents())
    }
  }

  _moveColumnInArray(columns, from, to, after, updateRows) {
    const fromIndex = columns.indexOf(from)
    let toIndex
    let rows = []

    if (fromIndex > -1) {
      columns.splice(fromIndex, 1)

      toIndex = columns.indexOf(to)

      if (toIndex > -1) {
        if (after) {
          toIndex = toIndex + 1
        }
      } else {
        toIndex = fromIndex
      }

      columns.splice(toIndex, 0, from)

      if (updateRows) {
        rows = this.chain('column-moving-rows', [from, to, after], null, []) || []

        rows = rows.concat(this.table.rowManager.rows)

        rows.forEach((row) => {
          if (row.cells.length) {
            const cell = row.cells.splice(fromIndex, 1)[0]
            row.cells.splice(toIndex, 0, cell)
          }
        })
      }
    }
  }

  scrollToColumn(column, position, ifVisible) {
    let left = 0
    const offset = column.getLeftOffset()
    let adjust = 0
    const colEl = column.getElement()

    return new Promise((resolve, reject) => {
      position ??= this.table.options.scrollToColumnPosition
      ifVisible ??= this.table.options.scrollToColumnIfVisible

      if (column.visible) {
        // align to correct position
        switch (position) {
          case 'middle':
          case 'center':
            adjust = -this.element.clientWidth / 2
            break

          case 'right':
            adjust = colEl.clientWidth - this.headersElement.clientWidth
            break
        }

        // check column visibility
        if (!ifVisible) {
          if (offset > 0 && offset + colEl.offsetWidth < this.element.clientWidth) {
            return false
          }
        }

        // calculate scroll position
        left = offset + adjust

        left = Math.max(
          Math.min(left, this.table.rowManager.element.scrollWidth - this.table.rowManager.element.clientWidth),
          0
        )

        this.table.rowManager.scrollHorizontal(left)
        this.scrollHorizontal(left)

        resolve()
      } else {
        console.warn('Scroll Error - Column not visible')
        reject('Scroll Error - Column not visible')
      }
    })
  }

  /// ///////////// Cell Management /////////////////
  generateCells(row) {
    const cells = []

    this.columnsByIndex.forEach((column) => {
      cells.push(column.generateCell(row))
    })

    return cells
  }

  /// ///////////// Column Management /////////////////
  getFlexBaseWidth() {
    let totalWidth = this.table.element.clientWidth // table element width
    let fixedWidth = 0

    // adjust for vertical scrollbar if present
    if (this.table.rowManager.element.scrollHeight > this.table.rowManager.element.clientHeight) {
      totalWidth -= this.table.rowManager.element.offsetWidth - this.table.rowManager.element.clientWidth
    }

    this.columnsByIndex.forEach((column) => {
      let width, minWidth, colWidth

      if (column.visible) {
        width = column.definition.width || 0

        minWidth = Number.parseInt(column.minWidth, 10)

        if (typeof width === 'string') {
          if (width.indexOf('%') > -1) {
            colWidth = (totalWidth / 100) * Number.parseInt(width, 10)
          } else {
            colWidth = Number.parseInt(width, 10)
          }
        } else {
          colWidth = width
        }

        fixedWidth += colWidth > minWidth ? colWidth : minWidth
      }
    })

    return fixedWidth
  }

  addColumn(definition, before, nextToColumn) {
    return new Promise((resolve, reject) => {
      const column = this._addColumn(definition, before, nextToColumn)

      this._reIndexColumns()

      this.dispatch('column-add', definition, before, nextToColumn)

      if (this.layoutMode() !== 'fitColumns') {
        column.reinitializeWidth()
      }

      this.redraw(true)

      this.table.rowManager.reinitialize()

      this.rerenderColumns()

      resolve(column)
    })
  }

  // remove column from system
  deregisterColumn(column) {
    const field = column.getField()
    let index

    // remove from field list
    if (field) {
      delete this.columnsByField[field]
    }

    // remove from index list
    index = this.columnsByIndex.indexOf(column)

    if (index > -1) {
      this.columnsByIndex.splice(index, 1)
    }

    // remove from column list
    index = this.columns.indexOf(column)

    if (index > -1) {
      this.columns.splice(index, 1)
    }

    this.verticalAlignHeaders()

    this.redraw()
  }

  rerenderColumns(update, silent) {
    if (!this.redrawBlock) {
      this.renderer.rerenderColumns(update, silent)
    } else {
      if (update === false || (update === true && this.redrawBlockUpdate === null)) {
        this.redrawBlockUpdate = update
      }
    }
  }

  blockRedraw() {
    this.redrawBlock = true
    this.redrawBlockUpdate = null
  }

  restoreRedraw() {
    this.redrawBlock = false
    this.verticalAlignHeaders()
    this.renderer.rerenderColumns(this.redrawBlockUpdate)
  }

  // redraw columns
  redraw(force) {
    if (Helpers.elVisible(this.element)) {
      this.verticalAlignHeaders()
    }

    if (force) {
      this.table.rowManager.resetScroll()
      this.table.rowManager.reinitialize()
    }

    if (!this.confirm('table-redrawing', force)) {
      this.layoutRefresh(force)
    }

    this.dispatch('table-redraw', force)

    this.table.footerManager.redraw()
  }
}
