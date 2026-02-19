import Module from '../../core/Module.js'

import defaultSorters from './defaults/sorters.js'

export default class Sort extends Module {
  static moduleName = 'sort'

  // load defaults
  static sorters = defaultSorters

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.sortList = [] // holder current sort
    this.changed = false // has the sort changed since last render

    this.registerTableOption('sortMode', 'local') // local or remote sorting

    this.registerTableOption('initialSort', false) // initial sorting criteria
    this.registerTableOption('columnHeaderSortMulti', true) // multiple or single column sorting
    this.registerTableOption('sortOrderReverse', false) // reverse internal sort ordering
    this.registerTableOption('headerSortElement', "<div class='tabulator-arrow'></div>") // header sort element
    this.registerTableOption('headerSortClickElement', 'header') // element which triggers sort when clicked

    this.registerColumnOption('sorter')
    this.registerColumnOption('sorterParams')

    this.registerColumnOption('headerSort', true)
    this.registerColumnOption('headerSortStartingDir')
    this.registerColumnOption('headerSortTristate')
  }

  /**
   * Initialize sorting handlers and table APIs.
   * @returns {void}
   */
  initialize() {
    this.subscribe('column-layout', this.initializeColumn.bind(this))
    this.subscribe('table-built', this.tableBuilt.bind(this))
    this.registerDataHandler(this.sort.bind(this), 20)

    this.registerTableFunction('setSort', this.userSetSort.bind(this))
    this.registerTableFunction('getSorters', this.getSort.bind(this))
    this.registerTableFunction('clearSort', this.clearSort.bind(this))

    if (this.table.options.sortMode === 'remote') {
      this.subscribe('data-params', this.remoteSortParams.bind(this))
    }
  }

  /**
   * Apply initial sort after table build.
   * @returns {void}
   */
  tableBuilt() {
    if (this.table.options.initialSort) {
      this.setSort(this.table.options.initialSort)
    }
  }

  /**
   * Inject sort params for remote sort mode.
   * @param {*} data Data source descriptor.
   * @param {object} config Request config.
   * @param {boolean} silent Silent flag.
   * @param {object} params Request params.
   * @returns {object}
   */
  remoteSortParams(data, config, silent, params) {
    const sorters = this.getSort()

    sorters.forEach((item) => {
      delete item.column
    })

    params.sort = sorters

    return params
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////

  /**
   * User-facing sort setter.
   * @param {*} sortList Sort descriptor(s).
   * @param {string} [dir] Sort direction.
   * @returns {void}
   */
  userSetSort(sortList, dir) {
    this.setSort(sortList, dir)
    // this.table.rowManager.sorterRefresh();
    this.refreshSort()
  }

  /**
   * Clear all sorting and refresh data.
   * @returns {void}
   */
  clearSort() {
    this.clear()
    // this.table.rowManager.sorterRefresh();
    this.refreshSort()
  }

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Initialize sort metadata and click handlers for a column.
   * @param {object} column Internal column.
   * @returns {void}
   */
  initializeColumn(column) {
    let sorter = false
    let colEl
    let arrowEl

    switch (typeof column.definition.sorter) {
      case 'string':
        if (Sort.sorters[column.definition.sorter]) {
          sorter = Sort.sorters[column.definition.sorter]
        } else {
          console.warn('Sort Error - No such sorter found: ', column.definition.sorter)
        }
        break

      case 'function':
        sorter = column.definition.sorter
        break
    }

    column.modules.sort = {
      sorter,
      dir: 'none',
      params: column.definition.sorterParams || {},
      startingDir: column.definition.headerSortStartingDir || 'asc',
      tristate: column.definition.headerSortTristate
    }

    if (column.definition.headerSort !== false) {
      colEl = column.getElement()

      colEl.classList.add('tabulator-sortable')

      arrowEl = document.createElement('div')
      arrowEl.classList.add('tabulator-col-sorter')

      switch (this.table.options.headerSortClickElement) {
        case 'icon':
          arrowEl.classList.add('tabulator-col-sorter-element')
          break
        case 'header':
          colEl.classList.add('tabulator-col-sorter-element')
          break
        default:
          colEl.classList.add('tabulator-col-sorter-element')
          break
      }

      switch (this.table.options.headerSortElement) {
        case 'function':
          // do nothing
          break

        case 'object':
          arrowEl.appendChild(this.table.options.headerSortElement)
          break

        default:
          arrowEl.innerHTML = this.table.options.headerSortElement
      }

      // create sorter arrow
      column.titleHolderElement.appendChild(arrowEl)

      column.modules.sort.element = arrowEl

      this.setColumnHeaderSortIcon(column, 'none')

      if (this.table.options.headerSortClickElement === 'icon') {
        arrowEl.addEventListener('mousedown', (e) => {
          e.stopPropagation()
        })
      }

      // sort on click
      const el = this.table.options.headerSortClickElement === 'icon' ? arrowEl : colEl

      el.addEventListener('click', (e) => {
        let dir
        let sorters
        let match

        if (column.modules.sort) {
          if (column.modules.sort.tristate) {
            if (column.modules.sort.dir === 'none') {
              dir = column.modules.sort.startingDir
            } else {
              if (column.modules.sort.dir === column.modules.sort.startingDir) {
                dir = column.modules.sort.dir === 'asc' ? 'desc' : 'asc'
              } else {
                dir = 'none'
              }
            }
          } else {
            switch (column.modules.sort.dir) {
              case 'asc':
                dir = 'desc'
                break

              case 'desc':
                dir = 'asc'
                break

              default:
                dir = column.modules.sort.startingDir
            }
          }

          if (this.table.options.columnHeaderSortMulti && (e.shiftKey || e.ctrlKey)) {
            sorters = this.getSort()

            match = sorters.findIndex((sorter) => {
              return sorter.field === column.getField()
            })

            if (match > -1) {
              sorters[match].dir = dir

              match = sorters.splice(match, 1)[0]
              if (dir !== 'none') {
                sorters.push(match)
              }
            } else {
              if (dir !== 'none') {
                sorters.push({ column, dir })
              }
            }

            // add to existing sort
            this.setSort(sorters)
          } else {
            if (dir === 'none') {
              this.clear()
            } else {
              // sort by column only
              this.setSort(column, dir)
            }
          }

          // this.table.rowManager.sorterRefresh(!this.sortList.length);
          this.refreshSort()
        }
      })
    }
  }

  /**
   * Refresh data after sort changes.
   * @returns {void}
   */
  refreshSort() {
    const left = this.table.rowManager.scrollLeft

    if (this.table.options.sortMode === 'remote') {
      this.reloadData(null, false, false).finally(() => {
        this.table.rowManager.scrollHorizontal(left)
        this.table.columnManager.scrollHorizontal(left)
      })
    } else {
      this.refreshData(true)
      this.table.rowManager.scrollHorizontal(left)
      this.table.columnManager.scrollHorizontal(left)
    }
  }

  /**
   * Check if sort config changed since last read.
   * @returns {boolean}
   */
  hasChanged() {
    const changed = this.changed
    this.changed = false
    return changed
  }

  /**
   * Return current sorter list in public format.
   * @returns {Array<object>}
   */
  getSort() {
    return this.sortList
      .filter((item) => item.column)
      .map((item) => ({ column: item.column.getComponent(), field: item.column.getField(), dir: item.dir }))
  }

  /**
   * Set internal sort list.
   * @param {*} sortList Sort descriptor(s).
   * @param {string} [dir] Sort direction.
   * @returns {void}
   */
  setSort(sortList, dir) {
    const newSortList = []

    if (!Array.isArray(sortList)) {
      sortList = [{ column: sortList, dir }]
    }

    sortList.forEach((item) => {
      const column = this.table.columnManager.findColumn(item.column)

      if (column) {
        item.column = column
        newSortList.push(item)
        this.changed = true
      } else {
        console.warn('Sort Warning - Sort field does not exist and is being ignored: ', item.column)
      }
    })

    this.sortList = newSortList

    this.dispatch('sort-changed')
  }

  /**
   * Clear internal sort list.
   * @returns {void}
   */
  clear() {
    this.setSort([])
  }

  /**
   * Infer a sorter for a column based on row data values.
   * @param {object} column Internal column.
   * @returns {Function}
   */
  findSorter(column) {
    let row = this.table.rowManager.activeRows[0]
    let sorter = 'string'
    let field
    let value

    if (row) {
      row = row.getData()
      field = column.getField()

      if (field) {
        value = column.getFieldValue(row)

        switch (typeof value) {
          case 'undefined':
            sorter = 'string'
            break

          case 'boolean':
            sorter = 'boolean'
            break

          default:
            if (!isNaN(value) && value !== '') {
              sorter = 'number'
            } else {
              if (value.match(/((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+$/i)) {
                sorter = 'alphanum'
              }
            }
            break
        }
      }
    }

    return Sort.sorters[sorter]
  }

  /**
   * Sort row data using current sorter list.
   * @param {Array<object>} data Row data array.
   * @param {boolean} [sortOnly] Skip header updates when true.
   * @returns {Array<object>}
   */
  sort(data, sortOnly) {
    const sortList = this.table.options.sortOrderReverse ? this.sortList.slice().reverse() : this.sortList
    const sortListActual = []
    const rowComponents = []

    if (this.subscribedExternal('dataSorting')) {
      this.dispatchExternal('dataSorting', this.getSort())
    }

    if (!sortOnly) {
      this.clearColumnHeaders()
    }

    if (this.table.options.sortMode !== 'remote') {
      // build list of valid sorters and trigger column specific callbacks before sort begins
      sortList.forEach((item) => {
        let sortObj

        if (item.column) {
          sortObj = item.column.modules.sort

          if (sortObj) {
            // if no sorter has been defined, take a guess
            if (!sortObj.sorter) {
              sortObj.sorter = this.findSorter(item.column)
            }

            item.params =
              typeof sortObj.params === 'function'
                ? sortObj.params(item.column.getComponent(), item.dir)
                : sortObj.params

            sortListActual.push(item)
          }

          if (!sortOnly) {
            this.setColumnHeader(item.column, item.dir)
          }
        }
      })

      // sort data
      if (sortListActual.length) {
        this._sortItems(data, sortListActual)
      }
    } else if (!sortOnly) {
      sortList.forEach((item) => {
        this.setColumnHeader(item.column, item.dir)
      })
    }

    if (this.subscribedExternal('dataSorted')) {
      data.forEach((row) => {
        rowComponents.push(row.getComponent())
      })

      this.dispatchExternal('dataSorted', this.getSort(), rowComponents)
    }

    return data
  }

  /**
   * Clear sort state and icons on all columns.
   * @returns {void}
   */
  clearColumnHeaders() {
    this.table.columnManager.getRealColumns().forEach((column) => {
      if (column.modules.sort) {
        column.modules.sort.dir = 'none'
        column.getElement().setAttribute('aria-sort', 'none')
        this.setColumnHeaderSortIcon(column, 'none')
      }
    })
  }

  /**
   * Set header sort direction for a column.
   * @param {object} column Internal column.
   * @param {string} dir Sort direction.
   * @returns {void}
   */
  setColumnHeader(column, dir) {
    column.modules.sort.dir = dir
    column.getElement().setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending')
    this.setColumnHeaderSortIcon(column, dir)
  }

  /**
   * Render/refresh sort icon for a column.
   * @param {object} column Internal column.
   * @param {string} dir Sort direction.
   * @returns {void}
   */
  setColumnHeaderSortIcon(column, dir) {
    const sortEl = column.modules.sort.element
    let arrowEl

    if (column.definition.headerSort && typeof this.table.options.headerSortElement === 'function') {
      while (sortEl.firstChild) sortEl.removeChild(sortEl.firstChild)

      arrowEl = this.table.options.headerSortElement.call(this.table, column.getComponent(), dir)

      if (typeof arrowEl === 'object') {
        sortEl.appendChild(arrowEl)
      } else {
        sortEl.innerHTML = arrowEl
      }
    }
  }

  /**
   * Sort row list using prepared sorters.
   * @param {Array<object>} data Rows.
   * @param {Array<object>} sortList Prepared sort config.
   * @returns {void}
   */
  _sortItems(data, sortList) {
    const sorterCount = sortList.length - 1

    data.sort((a, b) => {
      let result

      for (let i = sorterCount; i >= 0; i--) {
        const sortItem = sortList[i]

        result = this._sortRow(a, b, sortItem.column, sortItem.dir, sortItem.params)

        if (result !== 0) {
          break
        }
      }

      return result
    })
  }

  /**
   * Compare two rows using a column sorter.
   * @param {object} a Row A.
   * @param {object} b Row B.
   * @param {object} column Internal column.
   * @param {string} dir Sort direction.
   * @param {*} params Sorter params.
   * @returns {number}
   */
  _sortRow(a, b, column, dir, params) {
    let el1Comp, el2Comp

    // switch elements depending on search direction
    const el1 = dir === 'asc' ? a : b
    const el2 = dir === 'asc' ? b : a

    a = column.getFieldValue(el1.getData())
    b = column.getFieldValue(el2.getData())

    a = typeof a !== 'undefined' ? a : ''
    b = typeof b !== 'undefined' ? b : ''

    el1Comp = el1.getComponent()
    el2Comp = el2.getComponent()

    return column.modules.sort.sorter.call(this, a, b, el1Comp, el2Comp, column.getComponent(), dir, params)
  }
}
