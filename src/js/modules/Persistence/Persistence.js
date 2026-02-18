import Module from '../../core/Module.js'

import defaultReaders from './defaults/readers.js'
import defaultWriters from './defaults/writers.js'

export default class Persistence extends Module {
  static moduleName = 'persistence'

  static moduleInitOrder = -10

  // load defaults
  static readers = defaultReaders
  static writers = defaultWriters

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.mode = ''
    this.id = ''
    // this.persistProps = ["field", "width", "visible"];
    this.defWatcherBlock = false
    this.config = {}
    this.readFunc = false
    this.writeFunc = false

    this.registerTableOption('persistence', false)
    this.registerTableOption('persistenceID', '') // key for persistent storage
    this.registerTableOption('persistenceMode', true) // mode for storing persistence information
    this.registerTableOption('persistenceReaderFunc', false) // function for handling persistence data reading
    this.registerTableOption('persistenceWriterFunc', false) // function for handling persistence data writing
  }

  // Test for whether localStorage is available for use.
  /**
   * Test if localStorage is available.
   * @returns {boolean}
   */
  localStorageTest() {
    const testKey = '_tabulator_test'

    try {
      window.localStorage.setItem(testKey, testKey)
      window.localStorage.removeItem(testKey)
      return true
    } catch (e) {
      return false
    }
  }

  // setup parameters
  /**
   * Initialize persistence configuration and subscriptions.
   * @returns {void}
   */
  initialize() {
    if (this.table.options.persistence) {
      // determine persistent layout storage type
      const mode = this.table.options.persistenceMode
      const id = this.table.options.persistenceID
      const resolveHandler = (customHandler, defaults, errorPrefix) => {
        if (!customHandler) {
          if (defaults[this.mode]) {
            return defaults[this.mode]
          }

          console.warn(`${errorPrefix} - invalid handler set`, this.mode)
          return false
        }

        if (typeof customHandler === 'function') {
          return customHandler
        }

        if (defaults[customHandler]) {
          return defaults[customHandler]
        }

        console.warn(`${errorPrefix} - invalid handler set`, customHandler)
        return false
      }

      let retrievedData

      this.mode = mode !== true ? mode : this.localStorageTest() ? 'local' : 'cookie'

      this.readFunc = resolveHandler(
        this.table.options.persistenceReaderFunc,
        Persistence.readers,
        'Persistence Read Error'
      )
      this.writeFunc = resolveHandler(
        this.table.options.persistenceWriterFunc,
        Persistence.writers,
        'Persistence Write Error'
      )

      // set storage tag
      this.id = `tabulator-${id || this.table.element.getAttribute('id') || ''}`

      this.config = {
        sort: this.table.options.persistence === true || this.table.options.persistence.sort,
        filter: this.table.options.persistence === true || this.table.options.persistence.filter,
        headerFilter: this.table.options.persistence === true || this.table.options.persistence.headerFilter,
        group: this.table.options.persistence === true || this.table.options.persistence.group,
        page: this.table.options.persistence === true || this.table.options.persistence.page,
        columns:
          this.table.options.persistence === true
            ? ['title', 'width', 'visible']
            : this.table.options.persistence.columns
      }

      // load pagination data if needed
      if (this.config.page) {
        retrievedData = this.retrieveData('page')

        if (retrievedData) {
          if (
            typeof retrievedData.paginationSize !== 'undefined' &&
            (this.config.page === true || this.config.page.size)
          ) {
            this.table.options.paginationSize = retrievedData.paginationSize
          }

          if (
            typeof retrievedData.paginationInitialPage !== 'undefined' &&
            (this.config.page === true || this.config.page.page)
          ) {
            this.table.options.paginationInitialPage = retrievedData.paginationInitialPage
          }
        }
      }

      // load group data if needed
      if (this.config.group) {
        retrievedData = this.retrieveData('group')

        if (retrievedData) {
          if (
            typeof retrievedData.groupBy !== 'undefined' &&
            (this.config.group === true || this.config.group.groupBy)
          ) {
            this.table.options.groupBy = retrievedData.groupBy
          }
          if (
            typeof retrievedData.groupStartOpen !== 'undefined' &&
            (this.config.group === true || this.config.group.groupStartOpen)
          ) {
            this.table.options.groupStartOpen = retrievedData.groupStartOpen
          }
          if (
            typeof retrievedData.groupHeader !== 'undefined' &&
            (this.config.group === true || this.config.group.groupHeader)
          ) {
            this.table.options.groupHeader = retrievedData.groupHeader
          }
        }
      }

      if (this.config.columns) {
        this.table.options.columns = this.load('columns', this.table.options.columns)
        this.subscribe('column-init', this.initializeColumn.bind(this))
        this.subscribe('column-show', this.save.bind(this, 'columns'))
        this.subscribe('column-hide', this.save.bind(this, 'columns'))
        this.subscribe('column-moved', this.save.bind(this, 'columns'))
      }

      this.subscribe('table-built', this.tableBuilt.bind(this), 0)

      this.subscribe('table-redraw', this.tableRedraw.bind(this))

      this.subscribe('filter-changed', this.eventSave.bind(this, 'filter'))
      this.subscribe('filter-changed', this.eventSave.bind(this, 'headerFilter'))
      this.subscribe('sort-changed', this.eventSave.bind(this, 'sort'))
      this.subscribe('group-changed', this.eventSave.bind(this, 'group'))
      this.subscribe('page-changed', this.eventSave.bind(this, 'page'))
      this.subscribe('column-resized', this.eventSave.bind(this, 'columns'))
      this.subscribe('column-width', this.eventSave.bind(this, 'columns'))
      this.subscribe('layout-refreshed', this.eventSave.bind(this, 'columns'))
    }

    this.registerTableFunction('getColumnLayout', this.getColumnLayout.bind(this))
    this.registerTableFunction('setColumnLayout', this.setColumnLayout.bind(this))
  }

  /**
   * Persist data for event type when configured.
   * @param {string} type Persistence type key.
   * @returns {void}
   */
  eventSave(type) {
    if (this.config[type]) {
      this.save(type)
    }
  }

  /**
   * Apply persisted startup sort/filter values.
   * @returns {void}
   */
  tableBuilt() {
    let sorters, filters, headerFilters

    if (this.config.sort) {
      sorters = this.load('sort')

      if (sorters !== false) {
        this.table.options.initialSort = sorters
      }
    }

    if (this.config.filter) {
      filters = this.load('filter')

      if (filters !== false) {
        this.table.options.initialFilter = filters
      }
    }

    if (this.config.headerFilter) {
      headerFilters = this.load('headerFilter')

      if (headerFilters !== false) {
        this.table.options.initialHeaderFilter = headerFilters
      }
    }
  }

  /**
   * Persist columns on forced redraw.
   * @param {boolean} force Force redraw flag.
   * @returns {void}
   */
  tableRedraw(force) {
    if (force && this.config.columns) {
      this.save('columns')
    }
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////

  /**
   * Get current column layout in persistence format.
   * @returns {Array<object>}
   */
  getColumnLayout() {
    return this.parseColumns(this.table.columnManager.getColumns())
  }

  /**
   * Set column layout from persisted structure.
   * @param {Array<object>} layout Column layout.
   * @returns {boolean}
   */
  setColumnLayout(layout) {
    this.table.columnManager.setColumns(this.mergeDefinition(this.table.options.columns, layout, true))
    return true
  }

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Initialize definition watchers for a column.
   * @param {object} column Internal column.
   * @returns {void}
   */
  initializeColumn(column) {
    let def, keys

    if (this.config.columns) {
      this.defWatcherBlock = true

      def = column.getDefinition()

      keys = this.config.columns === true ? Object.keys(def) : this.config.columns

      keys.forEach((key) => {
        const props = Object.getOwnPropertyDescriptor(def, key)
        let value = def[key]

        if (props) {
          Object.defineProperty(def, key, {
            set: (newValue) => {
              value = newValue

              if (!this.defWatcherBlock) {
                this.save('columns')
              }

              if (props.set) {
                props.set(newValue)
              }
            },
            get: () => {
              if (props.get) {
                props.get()
              }
              return value
            }
          })
        }
      })

      this.defWatcherBlock = false
    }
  }

  // load saved definitions
  /**
   * Load persisted data and optionally merge with current values.
   * @param {string} type Persistence type.
   * @param {*} [current] Current value.
   * @returns {*}
   */
  load(type, current) {
    let data = this.retrieveData(type)

    if (current) {
      data = data ? this.mergeDefinition(current, data) : current
    }

    return data
  }

  // retrieve data from memory
  /**
   * Retrieve persisted data for a type.
   * @param {string} type Persistence type.
   * @returns {*}
   */
  retrieveData(type) {
    return this.readFunc ? this.readFunc(this.id, type) : false
  }

  // merge old and new column definitions
  /**
   * Merge persisted column definition data into current columns.
   * @param {Array<object>} oldCols Current columns.
   * @param {Array<object>} newCols Persisted columns.
   * @param {boolean} [mergeAllNew] Merge all incoming keys.
   * @returns {Array<object>}
   */
  mergeDefinition(oldCols, newCols, mergeAllNew) {
    const output = []

    newCols = newCols || []

    newCols.forEach((column, to) => {
      const from = this._findColumn(oldCols, column)
      let keys

      if (from) {
        if (mergeAllNew) {
          keys = Object.keys(column)
        } else if (this.config.columns === true || this.config.columns === undefined) {
          keys = Object.keys(from)
          keys.push('width')
        } else {
          keys = this.config.columns
        }

        keys.forEach((key) => {
          if (key !== 'columns' && typeof column[key] !== 'undefined') {
            from[key] = column[key]
          }
        })

        if (from.columns) {
          from.columns = this.mergeDefinition(from.columns, column.columns)
        }

        output.push(from)
      }
    })

    oldCols.forEach((column, i) => {
      const from = this._findColumn(newCols, column)

      if (!from) {
        if (output.length > i) {
          output.splice(i, 0, column)
        } else {
          output.push(column)
        }
      }
    })

    return output
  }

  // find matching columns
  /**
   * Find a matching column definition.
   * @param {Array<object>} columns Column list.
   * @param {object} subject Column definition.
   * @returns {object|undefined}
   */
  _findColumn(columns, subject) {
    const type = subject.columns ? 'group' : subject.field ? 'field' : 'object'

    return columns.find((col) => {
      switch (type) {
        case 'group':
          return col.title === subject.title && col.columns.length === subject.columns.length

        case 'field':
          return col.field === subject.field

        case 'object':
          return col === subject
      }
    })
  }

  // save data
  /**
   * Save persistence payload for a type.
   * @param {string} type Persistence type.
   * @returns {void}
   */
  save(type) {
    let data = {}

    switch (type) {
      case 'columns':
        data = this.parseColumns(this.table.columnManager.getColumns())
        break

      case 'filter':
        data = this.table.modules.filter.getFilters()
        break

      case 'headerFilter':
        data = this.table.modules.filter.getHeaderFilters()
        break

      case 'sort':
        data = this.validateSorters(this.table.modules.sort.getSort())
        break

      case 'group':
        data = this.getGroupConfig()
        break

      case 'page':
        data = this.getPageConfig()
        break
    }

    if (this.writeFunc) {
      this.writeFunc(this.id, type, data)
    }
  }

  // ensure sorters contain no function data
  /**
   * Normalize sorters for persistence storage.
   * @param {Array<object>} data Sorter data.
   * @returns {Array<object>}
   */
  validateSorters(data) {
    data.forEach((item) => {
      item.column = item.field
      delete item.field
    })

    return data
  }

  /**
   * Build persisted group config payload.
   * @returns {object}
   */
  getGroupConfig() {
    const data = {}

    if (this.config.group) {
      if (this.config.group === true || this.config.group.groupBy) {
        data.groupBy = this.table.options.groupBy
      }

      if (this.config.group === true || this.config.group.groupStartOpen) {
        data.groupStartOpen = this.table.options.groupStartOpen
      }

      if (this.config.group === true || this.config.group.groupHeader) {
        data.groupHeader = this.table.options.groupHeader
      }
    }

    return data
  }

  /**
   * Build persisted pagination config payload.
   * @returns {object}
   */
  getPageConfig() {
    const data = {}

    if (this.config.page) {
      if (this.config.page === true || this.config.page.size) {
        data.paginationSize = this.table.modules.page.getPageSize()
      }

      if (this.config.page === true || this.config.page.page) {
        data.paginationInitialPage = this.table.modules.page.getPage()
      }
    }

    return data
  }

  // parse columns for data to store
  /**
   * Convert columns into persistable layout structure.
   * @param {Array<object>} columns Internal columns.
   * @returns {Array<object>}
   */
  parseColumns(columns) {
    const definitions = []
    const excludedKeys = ['headerContextMenu', 'headerMenu', 'contextMenu', 'clickMenu']

    columns.forEach((column) => {
      const defStore = {}
      const colDef = column.getDefinition()
      let keys

      if (column.isGroup) {
        defStore.title = colDef.title
        defStore.columns = this.parseColumns(column.getColumns())
      } else {
        defStore.field = column.getField()

        if (this.config.columns === true || this.config.columns === undefined) {
          keys = Object.keys(colDef)
          keys.push('width')
          keys.push('visible')
        } else {
          keys = this.config.columns
        }

        keys.forEach((key) => {
          switch (key) {
            case 'width':
              defStore.width = column.getWidth()
              break
            case 'visible':
              defStore.visible = column.visible
              break

            default:
              if (typeof colDef[key] !== 'function' && excludedKeys.indexOf(key) === -1) {
                defStore[key] = colDef[key]
              }
          }
        })
      }

      definitions.push(defStore)
    })

    return definitions
  }
}
