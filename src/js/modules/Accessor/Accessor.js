import Module from '../../core/Module'
import Helpers from '../../core/tools/Helpers'

import defaultAccessors from './defaults/accessors'

export default class Accessor extends Module {
  static moduleName = 'accessor'

  // load defaults
  static accessors = defaultAccessors

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.allowedTypes = ['', 'data', 'download', 'clipboard', 'print', 'htmlOutput'] // list of accessor types

    this.registerColumnOption('accessor')
    this.registerColumnOption('accessorParams')
    this.registerColumnOption('accessorData')
    this.registerColumnOption('accessorDataParams')
    this.registerColumnOption('accessorDownload')
    this.registerColumnOption('accessorDownloadParams')
    this.registerColumnOption('accessorClipboard')
    this.registerColumnOption('accessorClipboardParams')
    this.registerColumnOption('accessorPrint')
    this.registerColumnOption('accessorPrintParams')
    this.registerColumnOption('accessorHtmlOutput')
    this.registerColumnOption('accessorHtmlOutputParams')
  }

  /**
   * Initialize accessor subscriptions.
   */
  initialize() {
    this.accessorColumns = null

    this.subscribe('column-layout', this.initializeColumn.bind(this))
    this.subscribe('row-data-retrieve', this.transformRow.bind(this))
    this.subscribe('columns-loaded', this._invalidateAccessorColumns.bind(this))
    this.subscribe('column-add', this._invalidateAccessorColumns.bind(this))
    this.subscribe('column-deleted', this._invalidateAccessorColumns.bind(this))
    this.subscribe('column-moved', this._invalidateAccessorColumns.bind(this))
  }

  _invalidateAccessorColumns() {
    this.accessorColumns = null
  }

  _getAccessorColumns() {
    if (this.accessorColumns) return this.accessorColumns
    const cols = []
    this.table.columnManager.traverse((column) => {
      if (column.modules.accessor) cols.push(column)
    })
    this.accessorColumns = cols
    return cols
  }

  // initialize column accessor
  /**
   * Build per-column accessor config.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    const config = {}

    let match = false

    this.allowedTypes.forEach((type) => {
      const key = `accessor${type.charAt(0).toUpperCase() + type.slice(1)}`

      let accessor

      if (column.definition[key]) {
        accessor = this.lookupAccessor(column.definition[key])

        if (accessor) {
          match = true

          config[key] = {
            accessor,
            params: column.definition[key + 'Params'] || {}
          }
        }
      }
    })

    if (match) {
      column.modules.accessor = config
    }
  }

  /**
   * Resolve accessor definition to function.
   * @param {string|Function} value Accessor definition.
   * @returns {Function|boolean}
   */
  lookupAccessor(value) {
    if (typeof value === 'function') {
      return value
    }

    if (typeof value === 'string') {
      const accessor = Accessor.accessors[value]

      if (accessor) {
        return accessor
      }

      console.warn('Accessor Error - No such accessor found, ignoring: ', value)
    }

    return false
  }

  // apply accessor to row
  /**
   * Apply accessors to row data for a given retrieval type.
   * @param {object} row Internal row.
   * @param {string} type Accessor type.
   * @returns {object}
   */
  transformRow(row, type) {
    const key = `accessor${type.charAt(0).toUpperCase() + type.slice(1)}`
    const columns = this._getAccessorColumns()

    // fast-path: no accessors registered, return data unchanged (avoids deep clone cost)
    if (columns.length === 0) {
      return row.data
    }

    const rowComponent = row.getComponent()

    // clone data object with deep copy to isolate internal data from returned result
    const data = Helpers.deepClone(row.data || {})

    for (const column of columns) {
      const accessor = column.modules.accessor[key] || column.modules.accessor.accessor || false

      if (accessor) {
        const value = column.getFieldValue(data)

        if (value !== undefined) {
          const colComponent = column.getComponent()
          const params =
            typeof accessor.params === 'function'
              ? accessor.params(value, data, type, colComponent, rowComponent)
              : accessor.params
          column.setFieldValue(data, accessor.accessor(value, data, type, params, colComponent, rowComponent))
        }
      }
    }

    return data
  }
}
