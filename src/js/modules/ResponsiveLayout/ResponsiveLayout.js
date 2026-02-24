import Module from '../../core/Module.js'
import extensions from './extensions/extensions.js'

export default class ResponsiveLayout extends Module {
  static moduleName = 'responsiveLayout'
  static moduleExtensions = extensions

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.columns = []
    this.hiddenColumns = []
    this.mode = ''
    this.index = 0
    this.collapseFormatter = []
    this.collapseStartOpen = true
    this.collapseHandleColumn = false

    this.registerTableOption('responsiveLayout', false) // responsive layout flags
    this.registerTableOption('responsiveLayoutCollapseStartOpen', true) // start showing collapsed data
    this.registerTableOption('responsiveLayoutCollapseUseFormatters', true) // responsive layout collapse formatter
    this.registerTableOption('responsiveLayoutCollapseFormatter', false) // responsive layout collapse formatter

    this.registerColumnOption('responsive')
  }

  // generate responsive columns list
  /**
   * Initialize responsive layout subscriptions.
   * @returns {void}
   */
  initialize() {
    if (this.table.options.responsiveLayout) {
      this.subscribe('column-layout', this.initializeColumn.bind(this))
      this.subscribe('column-show', this.updateColumnVisibility.bind(this))
      this.subscribe('column-hide', this.updateColumnVisibility.bind(this))
      this.subscribe('columns-loaded', this.initializeResponsivity.bind(this))
      this.subscribe('column-moved', this.initializeResponsivity.bind(this))
      this.subscribe('column-add', this.initializeResponsivity.bind(this))
      this.subscribe('column-delete', this.initializeResponsivity.bind(this))

      this.subscribe('table-redrawing', this.tableRedraw.bind(this))

      if (this.table.options.responsiveLayout === 'collapse') {
        this.subscribe('row-data-changed', this.generateCollapsedRowContent.bind(this))
        this.subscribe('row-init', this.initializeRow.bind(this))
        this.subscribe('row-layout', this.layoutRow.bind(this))
      }
    }
  }

  /**
   * Update responsive visibility during table redraw.
   * @param {boolean} force Force redraw state.
   * @returns {void}
   */
  tableRedraw(force) {
    if (!['fitColumns', 'fitDataStretch'].includes(this.layoutMode())) {
      if (!force) {
        this.update()
      }
    }
  }

  /**
   * Rebuild responsive metadata and hidden column lists.
   * @returns {void}
   */
  initializeResponsivity() {
    let columns = []

    this.mode = this.table.options.responsiveLayout
    this.collapseFormatter = this.table.options.responsiveLayoutCollapseFormatter || this.formatCollapsedData
    this.collapseStartOpen = this.table.options.responsiveLayoutCollapseStartOpen
    this.hiddenColumns = []

    if (this.collapseFormatter) {
      this.collapseFormatter = this.collapseFormatter.bind(this.table)
    }

    // determine level of responsivity for each column
    this.table.columnManager.columnsByIndex.forEach((column, i) => {
      if (column.modules.responsive) {
        if (column.modules.responsive.order && column.modules.responsive.visible) {
          column.modules.responsive.index = i
          columns.push(column)

          if (!column.visible && this.mode === 'collapse') {
            this.hiddenColumns.push(column)
          }
        }
      }
    })

    // sort list by responsivity
    columns = columns.reverse()
    columns = columns.sort((a, b) => {
      const diff = b.modules.responsive.order - a.modules.responsive.order
      return diff || b.modules.responsive.index - a.modules.responsive.index
    })

    this.columns = columns

    if (this.mode === 'collapse') {
      this.generateCollapsedContent()
    }

    // assign collapse column
    for (const col of this.table.columnManager.columnsByIndex) {
      if (col.definition.formatter === 'responsiveCollapse') {
        this.collapseHandleColumn = col
        break
      }
    }

    if (this.collapseHandleColumn) {
      if (this.hiddenColumns.length) {
        this.collapseHandleColumn.show()
      } else {
        this.collapseHandleColumn.hide()
      }
    }
  }

  // define layout information
  /**
   * Initialize responsive config for a column.
   * @param {object} column Internal column.
   * @returns {void}
   */
  initializeColumn(column) {
    const def = column.getDefinition()

    column.modules.responsive = {
      order: def.responsive === undefined ? 1 : def.responsive,
      visible: def.visible !== false
    }
  }

  /**
   * Initialize collapsed responsive row container.
   * @param {object} row Internal row.
   * @returns {void}
   */
  initializeRow(row) {
    let el

    if (row.type !== 'calc') {
      el = document.createElement('div')
      el.classList.add('tabulator-responsive-collapse')

      row.modules.responsiveLayout = {
        element: el,
        open: this.collapseStartOpen
      }

      if (!this.collapseStartOpen) {
        el.style.display = 'none'
      }
    }
  }

  /**
   * Layout collapsed responsive row content.
   * @param {object} row Internal row.
   * @returns {void}
   */
  layoutRow(row) {
    const rowEl = row.getElement()

    if (row.modules.responsiveLayout) {
      rowEl.appendChild(row.modules.responsiveLayout.element)
      this.generateCollapsedRowContent(row)
    }
  }

  // update column visibility
  /**
   * Track manual column visibility changes.
   * @param {object} column Internal column.
   * @param {boolean} responsiveToggle Responsive-driven change flag.
   * @returns {void}
   */
  updateColumnVisibility(column, responsiveToggle) {
    if (!responsiveToggle && column.modules.responsive) {
      column.modules.responsive.visible = column.visible
      this.initializeResponsivity()
    }
  }

  /**
   * Hide a column due to responsive constraints.
   * @param {object} column Internal column.
   * @returns {void}
   */
  hideColumn(column) {
    const colCount = this.hiddenColumns.length

    column.hide(false, true)

    if (this.mode === 'collapse') {
      this.hiddenColumns.unshift(column)
      this.generateCollapsedContent()

      if (this.collapseHandleColumn && !colCount) {
        this.collapseHandleColumn.show()
      }
    }
  }

  /**
   * Show a responsive-hidden column.
   * @param {object} column Internal column.
   * @returns {void}
   */
  showColumn(column) {
    let index

    column.show(false, true)
    // set column width to prevent calculation loops on uninitialized columns
    column.setWidth(column.getWidth())

    if (this.mode === 'collapse') {
      index = this.hiddenColumns.indexOf(column)

      if (index > -1) {
        this.hiddenColumns.splice(index, 1)
      }

      this.generateCollapsedContent()

      if (this.collapseHandleColumn && !this.hiddenColumns.length) {
        this.collapseHandleColumn.hide()
      }
    }
  }

  // redraw columns to fit space
  /**
   * Adjust visible columns to fit available width.
   * @returns {void}
   */
  update() {
    let working = true
    const isFitColumns = this.table.modules.layout.getMode() === 'fitColumns'

    while (working) {
      const width = isFitColumns ? this.table.columnManager.getFlexBaseWidth() : this.table.columnManager.getWidth()

      const diff =
        (this.table.options.headerVisible
          ? this.table.columnManager.element.clientWidth
          : this.table.element.clientWidth) - width

      if (diff < 0) {
        // table is too wide
        const column = this.columns[this.index]

        if (column) {
          this.hideColumn(column)
          this.index++
        } else {
          working = false
        }
      } else {
        // table has spare space
        const column = this.columns[this.index - 1]

        if (column) {
          if (diff > 0) {
            if (diff >= column.getWidth()) {
              this.showColumn(column)
              this.index--
            } else {
              working = false
            }
          } else {
            working = false
          }
        } else {
          working = false
        }
      }

      if (!this.table.rowManager.activeRowsCount) {
        this.table.rowManager.renderEmptyScroll()
      }
    }
  }

  /**
   * Regenerate collapsed content for all display rows.
   * @returns {void}
   */
  generateCollapsedContent() {
    const rows = this.table.rowManager.getDisplayRows()

    rows.forEach((row) => {
      this.generateCollapsedRowContent(row)
    })
  }

  /**
   * Generate collapsed content for a specific row.
   * @param {object} row Internal row.
   * @returns {void}
   */
  generateCollapsedRowContent(row) {
    let el, contents

    if (row.modules.responsiveLayout) {
      el = row.modules.responsiveLayout.element

      while (el.firstChild) el.removeChild(el.firstChild)

      contents = this.collapseFormatter(this.generateCollapsedRowData(row))
      if (contents) {
        el.appendChild(contents)
      }
      row.calcHeight(true)
    }
  }

  /**
   * Generate collapsed row data from hidden columns.
   * @param {object} row Internal row.
   * @returns {Array<object>}
   */
  generateCollapsedRowData(row) {
    const data = row.getData()
    const output = []
    let mockCellComponent

    this.hiddenColumns.forEach((column) => {
      const value = column.getFieldValue(data)

      if (column.definition.title && column.field) {
        if (column.modules.format && this.table.options.responsiveLayoutCollapseUseFormatters) {
          mockCellComponent = {
            value: false,
            data: {},
            getValue: function () {
              return value
            },
            getData: function () {
              return data
            },
            getType: function () {
              return 'cell'
            },
            getElement: function () {
              return document.createElement('div')
            },
            getRow: function () {
              return row.getComponent()
            },
            getColumn: function () {
              return column.getComponent()
            },
            getTable: () => this.table
          }

          function onRendered(callback) {
            callback()
          }

          output.push({
            field: column.field,
            title: column.definition.title,
            value: column.modules.format.formatter.call(
              this.table.modules.format,
              mockCellComponent,
              column.modules.format.params,
              onRendered
            )
          })
        } else {
          output.push({
            field: column.field,
            title: column.definition.title,
            value
          })
        }
      }
    })

    return output
  }

  /**
   * Default collapsed row formatter.
   * @param {Array<object>} data Collapsed row data.
   * @returns {HTMLElement|string}
   */
  formatCollapsedData(data) {
    const list = document.createElement('table')

    data.forEach((item) => {
      const row = document.createElement('tr')
      const titleData = document.createElement('td')
      const valueData = document.createElement('td')
      let node_content

      const titleHighlight = document.createElement('strong')
      titleData.appendChild(titleHighlight)

      this.modules.localize.bind(`columns|${item.field}`, (text) => {
        titleHighlight.innerHTML = text || item.title
      })

      if (item.value instanceof Node) {
        node_content = document.createElement('div')
        node_content.appendChild(item.value)
        valueData.appendChild(node_content)
      } else {
        valueData.innerHTML = item.value
      }

      row.appendChild(titleData)
      row.appendChild(valueData)
      list.appendChild(row)
    })

    return data.length ? list : ''
  }
}
