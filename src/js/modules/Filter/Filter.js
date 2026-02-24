import Module from '../../core/Module.js'

import defaultFilters from './defaults/filters.js'

export default class Filter extends Module {
  static moduleName = 'filter'

  // load defaults
  static filters = defaultFilters

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.filterList = [] // hold filter list
    this.headerFilters = {} // hold column filters
    this.headerFilterColumns = [] // hold columns that use header filters

    this.prevHeaderFilterChangeCheck = ''
    this.prevHeaderFilterChangeCheck = '{}'

    this.changed = false // has filtering changed since last render
    this.tableInitialized = false

    this.registerTableOption('filterMode', 'local') // local or remote filtering

    this.registerTableOption('initialFilter', false) // initial filtering criteria
    this.registerTableOption('initialHeaderFilter', false) // initial header filtering criteria
    this.registerTableOption('headerFilterLiveFilterDelay', 300) // delay before updating column after user types in header filter
    this.registerTableOption('placeholderHeaderFilter', false) // placeholder when header filter is empty

    this.registerColumnOption('headerFilter')
    this.registerColumnOption('headerFilterPlaceholder')
    this.registerColumnOption('headerFilterParams')
    this.registerColumnOption('headerFilterEmptyCheck')
    this.registerColumnOption('headerFilterFunc')
    this.registerColumnOption('headerFilterFuncParams')
    this.registerColumnOption('headerFilterLiveFilter')

    this.registerTableFunction('searchRows', this.searchRows.bind(this))
    this.registerTableFunction('searchData', this.searchData.bind(this))

    this.registerTableFunction('setFilter', this.userSetFilter.bind(this))
    this.registerTableFunction('refreshFilter', this.userRefreshFilter.bind(this))
    this.registerTableFunction('addFilter', this.userAddFilter.bind(this))
    this.registerTableFunction('getFilters', this.getFilters.bind(this))
    this.registerTableFunction('setHeaderFilterFocus', this.userSetHeaderFilterFocus.bind(this))
    this.registerTableFunction('getHeaderFilterValue', this.userGetHeaderFilterValue.bind(this))
    this.registerTableFunction('setHeaderFilterValue', this.userSetHeaderFilterValue.bind(this))
    this.registerTableFunction('getHeaderFilters', this.getHeaderFilters.bind(this))
    this.registerTableFunction('removeFilter', this.userRemoveFilter.bind(this))
    this.registerTableFunction('clearFilter', this.userClearFilter.bind(this))
    this.registerTableFunction('clearHeaderFilter', this.userClearHeaderFilter.bind(this))

    this.registerComponentFunction('column', 'headerFilterFocus', this.setHeaderFilterFocus.bind(this))
    this.registerComponentFunction('column', 'reloadHeaderFilter', this.reloadHeaderFilter.bind(this))
    this.registerComponentFunction('column', 'getHeaderFilterValue', this.getHeaderFilterValue.bind(this))
    this.registerComponentFunction('column', 'setHeaderFilterValue', this.setHeaderFilterValue.bind(this))
  }

  /**
   * Initialize filter subscriptions and data handler.
   * @returns {void}
   */
  initialize() {
    this.subscribe('column-init', this.initializeColumnHeaderFilter.bind(this))
    this.subscribe('column-width-fit-before', this.hideHeaderFilterElements.bind(this))
    this.subscribe('column-width-fit-after', this.showHeaderFilterElements.bind(this))
    this.subscribe('table-built', this.tableBuilt.bind(this))
    this.subscribe('placeholder', this.generatePlaceholder.bind(this))

    if (this.table.options.filterMode === 'remote') {
      this.subscribe('data-params', this.remoteFilterParams.bind(this))
    }

    this.registerDataHandler(this.filter.bind(this), 10)
  }

  /**
   * Apply initial table and header filters once the table is built.
   * @returns {void}
   */
  tableBuilt() {
    if (this.table.options.initialFilter) {
      this.setFilter(this.table.options.initialFilter)
    }

    if (this.table.options.initialHeaderFilter) {
      this.table.options.initialHeaderFilter.forEach((item) => {
        const column = this.table.columnManager.findColumn(item.field)

        if (column) {
          this.setHeaderFilterValue(column, item.value)
        } else {
          console.warn('Column Filter Error - No matching column found:', item.field)
          return false
        }
      })
    }

    this.tableInitialized = true
  }

  /**
   * Attach active filters to remote request params.
   * @param {Array<object>} data Data payload.
   * @param {object} config Request config.
   * @param {boolean} silent Silent flag.
   * @param {object} params Request params.
   * @returns {object}
   */
  remoteFilterParams(data, config, silent, params) {
    params.filter = this.getFilters(true, true)
    return params
  }

  /**
   * Generate header filter placeholder text.
   * @returns {string|undefined}
   */
  generatePlaceholder() {
    if (this.table.options.placeholderHeaderFilter && Object.keys(this.headerFilters).length) {
      return this.table.options.placeholderHeaderFilter
    }
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////

  // set standard filters
  /**
   * Set table filters from the public API and refresh.
   * @param {*} field Field, callback, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @param {object} [params] Filter params.
   * @returns {void}
   */
  userSetFilter(field, type, value, params) {
    this.setFilter(field, type, value, params)
    this.refreshFilter()
  }

  // set standard filters
  /**
   * Refresh active filters from the public API.
   * @returns {void}
   */
  userRefreshFilter() {
    this.refreshFilter()
  }

  // add filter to array
  /**
   * Add a filter from the public API and refresh.
   * @param {*} field Field, callback, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @param {object} [params] Filter params.
   * @returns {void}
   */
  userAddFilter(field, type, value, params) {
    this.addFilter(field, type, value, params)
    this.refreshFilter()
  }

  /**
   * Focus a column header filter by field.
   * @param {string} field Column field.
   * @returns {boolean|void}
   */
  userSetHeaderFilterFocus(field) {
    const column = this.table.columnManager.findColumn(field)

    if (column) {
      this.setHeaderFilterFocus(column)
    } else {
      console.warn('Column Filter Focus Error - No matching column found:', field)
      return false
    }
  }

  /**
   * Get a column header filter value by field.
   * @param {string} field Column field.
   * @returns {*}
   */
  userGetHeaderFilterValue(field) {
    const column = this.table.columnManager.findColumn(field)

    if (column) {
      return this.getHeaderFilterValue(column)
    } else {
      console.warn('Column Filter Error - No matching column found:', field)
    }
  }

  /**
   * Set a column header filter value by field.
   * @param {string} field Column field.
   * @param {*} value Filter value.
   * @returns {boolean|void}
   */
  userSetHeaderFilterValue(field, value) {
    const column = this.table.columnManager.findColumn(field)

    if (column) {
      this.setHeaderFilterValue(column, value)
    } else {
      console.warn('Column Filter Error - No matching column found:', field)
      return false
    }
  }

  // remove filter from array
  /**
   * Remove filters from the public API and refresh.
   * @param {*} field Field, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @returns {void}
   */
  userRemoveFilter(field, type, value) {
    this.removeFilter(field, type, value)
    this.refreshFilter()
  }

  // clear filters
  /**
   * Clear filters from the public API and refresh.
   * @param {boolean} all Clear header filters as well.
   * @returns {void}
   */
  userClearFilter(all) {
    this.clearFilter(all)
    this.refreshFilter()
  }

  // clear header filters
  /**
   * Clear header filters from the public API and refresh.
   * @returns {void}
   */
  userClearHeaderFilter() {
    this.clearHeaderFilter()
    this.refreshFilter()
  }

  // search for specific row components
  /**
   * Search rows and return matching row components.
   * @param {*} field Field, callback, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @returns {Array<object>}
   */
  searchRows(field, type, value) {
    return this.search('rows', field, type, value)
  }

  // search for specific data
  /**
   * Search rows and return matching row data.
   * @param {*} field Field, callback, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @returns {Array<object>}
   */
  searchData(field, type, value) {
    return this.search('data', field, type, value)
  }

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Initialize header filter support for a column when enabled.
   * @param {object} column Internal column.
   * @returns {void}
   */
  initializeColumnHeaderFilter(column) {
    const def = column.definition

    if (def.headerFilter) {
      this.initializeColumn(column)
    }
  }

  // initialize column header filter
  /**
   * Build column filter state and success handler.
   * @param {object} column Internal column.
   * @returns {void}
   */
  initializeColumn(column) {
    const field = column.getField()

    // handle successfully value change
    const success = (value) => {
      const filterType =
        (column.modules.filter.tagType === 'input' && column.modules.filter.attrType === 'text') ||
        column.modules.filter.tagType == 'textarea'
          ? 'partial'
          : 'match'
      let type = ''
      let filterFunc

      if (typeof column.modules.filter.prevSuccess === 'undefined' || column.modules.filter.prevSuccess !== value) {
        column.modules.filter.prevSuccess = value

        if (!column.modules.filter.emptyFunc(value)) {
          column.modules.filter.value = value

          switch (typeof column.definition.headerFilterFunc) {
            case 'string':
              if (Filter.filters[column.definition.headerFilterFunc]) {
                type = column.definition.headerFilterFunc
                filterFunc = (data) => {
                  let params = column.definition.headerFilterFuncParams || {}
                  const fieldVal = column.getFieldValue(data)

                  params = typeof params === 'function' ? params(value, fieldVal, data) : params

                  return Filter.filters[column.definition.headerFilterFunc](value, fieldVal, data, params)
                }
              } else {
                console.warn(
                  'Header Filter Error - Matching filter function not found: ',
                  column.definition.headerFilterFunc
                )
              }
              break

            case 'function':
              filterFunc = (data) => {
                let params = column.definition.headerFilterFuncParams || {}
                const fieldVal = column.getFieldValue(data)

                params = typeof params === 'function' ? params(value, fieldVal, data) : params

                return column.definition.headerFilterFunc(value, fieldVal, data, params)
              }

              type = filterFunc
              break
          }

          if (!filterFunc) {
            switch (filterType) {
              case 'partial':
                filterFunc = (data) => {
                  const colVal = column.getFieldValue(data)

                  if (colVal !== undefined && colVal !== null) {
                    return String(colVal).toLowerCase().indexOf(String(value).toLowerCase()) > -1
                  }

                  return false
                }
                type = 'like'
                break

              default:
                filterFunc = (data) => {
                  return column.getFieldValue(data) == value
                }
                type = '='
            }
          }

          this.headerFilters[field] = { value, func: filterFunc, type }
        } else {
          delete this.headerFilters[field]
        }

        column.modules.filter.value = value

        const filterChangeCheck = JSON.stringify(this.headerFilters)

        if (this.prevHeaderFilterChangeCheck !== filterChangeCheck) {
          this.prevHeaderFilterChangeCheck = filterChangeCheck

          this.trackChanges()
          this.refreshFilter()
        }
      }

      return true
    }

    column.modules.filter = {
      success,
      attrType: false,
      tagType: false,
      emptyFunc: false
    }

    this.generateHeaderFilterElement(column)
  }

  /**
   * Generate and attach the header filter editor element.
   * @param {object} column Internal column.
   * @param {*} [initialValue] Initial filter value.
   * @param {boolean} [reinitialize] Rebuild existing filter element.
   * @returns {void}
   */
  generateHeaderFilterElement(column, initialValue, reinitialize) {
    const success = column.modules.filter.success
    const field = column.getField()
    let filterElement
    let editor
    let editorElement
    let cellWrapper
    let typingTimer
    let searchTrigger
    let params
    let onRenderedCallback

    column.modules.filter.value = initialValue

    // handle aborted edit
    const cancel = () => {}

    const onRendered = (callback) => {
      onRenderedCallback = callback
    }

    if (column.modules.filter.headerElement && column.modules.filter.headerElement.parentNode) {
      column.contentElement.removeChild(column.modules.filter.headerElement.parentNode)
    }

    if (field) {
      // set empty value function
      column.modules.filter.emptyFunc =
        column.definition.headerFilterEmptyCheck ||
        ((value) => {
          return !value && value !== 0
        })

      filterElement = document.createElement('div')
      filterElement.classList.add('tabulator-header-filter')

      // set column editor
      switch (typeof column.definition.headerFilter) {
        case 'string':
          if (this.table.modules.edit.editors[column.definition.headerFilter]) {
            editor = this.table.modules.edit.editors[column.definition.headerFilter]

            if (
              (column.definition.headerFilter === 'tick' || column.definition.headerFilter === 'tickCross') &&
              !column.definition.headerFilterEmptyCheck
            ) {
              column.modules.filter.emptyFunc = (value) => {
                return value !== true && value !== false
              }
            }
          } else {
            console.warn('Filter Error - Cannot build header filter, No such editor found: ', column.definition.editor)
          }
          break

        case 'function':
          editor = column.definition.headerFilter
          break

        case 'boolean':
          if (column.modules.edit && column.modules.edit.editor) {
            editor = column.modules.edit.editor
          } else {
            if (column.definition.formatter && this.table.modules.edit.editors[column.definition.formatter]) {
              editor = this.table.modules.edit.editors[column.definition.formatter]

              if (
                (column.definition.formatter === 'tick' || column.definition.formatter === 'tickCross') &&
                !column.definition.headerFilterEmptyCheck
              ) {
                column.modules.filter.emptyFunc = (value) => {
                  return value !== true && value !== false
                }
              }
            } else {
              editor = this.table.modules.edit.editors.input
            }
          }
          break
      }

      if (editor) {
        cellWrapper = {
          getValue() {
            return initialValue !== undefined ? initialValue : ''
          },
          getField() {
            return column.definition.field
          },
          getElement() {
            return filterElement
          },
          getColumn() {
            return column.getComponent()
          },
          getTable: () => {
            return this.table
          },
          getType: () => {
            return 'header'
          },
          getRow() {
            return {
              normalizeHeight() {}
            }
          }
        }

        params = column.definition.headerFilterParams || {}

        params = typeof params === 'function' ? params.call(this.table, cellWrapper) : params

        editorElement = editor.call(this.table.modules.edit, cellWrapper, onRendered, success, cancel, params)

        if (!editorElement) {
          console.warn(`Filter Error - Cannot add filter to ${field} column, editor returned a value of false`)
          return
        }

        if (!(editorElement instanceof Node)) {
          console.warn(
            `Filter Error - Cannot add filter to ${field} column, editor should return an instance of Node, the editor returned:`,
            editorElement
          )
          return
        }

        // set Placeholder Text
        this.langBind(`headerFilters|columns|${column.definition.field}`, (value) => {
          editorElement.setAttribute(
            'placeholder',
            value !== undefined && value
              ? value
              : column.definition.headerFilterPlaceholder || this.langText('headerFilters|default')
          )
        })

        // focus on element on click
        editorElement.addEventListener('click', (e) => {
          e.stopPropagation()
          editorElement.focus()
        })

        editorElement.addEventListener('focus', () => {
          const left = this.table.columnManager.contentsElement.scrollLeft

          const headerPos = this.table.rowManager.element.scrollLeft

          if (left !== headerPos) {
            this.table.rowManager.scrollHorizontal(left)
            this.table.columnManager.scrollHorizontal(left)
          }
        })

        // live update filters as user types
        typingTimer = false

        searchTrigger = () => {
          if (typingTimer) {
            clearTimeout(typingTimer)
          }

          typingTimer = setTimeout(() => {
            success(editorElement.value)
          }, this.table.options.headerFilterLiveFilterDelay)
        }

        column.modules.filter.headerElement = editorElement
        column.modules.filter.attrType = editorElement.hasAttribute('type')
          ? editorElement.getAttribute('type').toLowerCase()
          : ''
        column.modules.filter.tagType = editorElement.tagName.toLowerCase()

        if (column.definition.headerFilterLiveFilter !== false) {
          if (
            !(
              column.definition.headerFilter === 'autocomplete' ||
              column.definition.headerFilter === 'tickCross' ||
              ((column.definition.editor === 'autocomplete' || column.definition.editor === 'tickCross') &&
                column.definition.headerFilter === true)
            )
          ) {
            editorElement.addEventListener('keyup', searchTrigger)
            editorElement.addEventListener('search', searchTrigger)

            // update number filtered columns on change
            if (column.modules.filter.attrType === 'number') {
              editorElement.addEventListener('change', () => {
                success(editorElement.value)
              })
            }

            // change text inputs to search inputs to allow for clearing of field
            if (column.modules.filter.attrType === 'text' && this.table.browser !== 'ie') {
              editorElement.setAttribute('type', 'search')
              // editorElement.off("change blur"); //prevent blur from triggering filter and preventing selection click
            }
          }

          // prevent input and select elements from propagating click to column sorters etc
          if (
            column.modules.filter.tagType === 'input' ||
            column.modules.filter.tagType === 'select' ||
            column.modules.filter.tagType === 'textarea'
          ) {
            editorElement.addEventListener('mousedown', (e) => {
              e.stopPropagation()
            })
          }
        }

        filterElement.appendChild(editorElement)

        column.contentElement.appendChild(filterElement)

        if (!reinitialize) {
          this.headerFilterColumns.push(column)
        }

        if (onRenderedCallback) {
          onRenderedCallback()
        }
      }
    } else {
      console.warn('Filter Error - Cannot add header filter, column has no field set:', column.definition.title)
    }
  }

  // hide all header filter elements (used to ensure correct column widths in "fitData" layout mode)
  /**
   * Hide all header filter elements.
   * @returns {void}
   */
  hideHeaderFilterElements() {
    this.headerFilterColumns.forEach((column) => {
      if (column.modules.filter && column.modules.filter.headerElement) {
        column.modules.filter.headerElement.style.display = 'none'
      }
    })
  }

  // show all header filter elements (used to ensure correct column widths in "fitData" layout mode)
  /**
   * Show all header filter elements.
   * @returns {void}
   */
  showHeaderFilterElements() {
    this.headerFilterColumns.forEach((column) => {
      if (column.modules.filter && column.modules.filter.headerElement) {
        column.modules.filter.headerElement.style.display = ''
      }
    })
  }

  // programmatically set focus of header filter
  /**
   * Focus a column header filter element.
   * @param {object} column Internal column.
   * @returns {void}
   */
  setHeaderFilterFocus(column) {
    if (column.modules.filter && column.modules.filter.headerElement) {
      column.modules.filter.headerElement.focus()
    } else {
      console.warn('Column Filter Focus Error - No header filter set on column:', column.getField())
    }
  }

  // programmatically get value of header filter
  /**
   * Read a column header filter value.
   * @param {object} column Internal column.
   * @returns {*}
   */
  getHeaderFilterValue(column) {
    if (column.modules.filter && column.modules.filter.headerElement) {
      return column.modules.filter.value
    } else {
      console.warn('Column Filter Error - No header filter set on column:', column.getField())
    }
  }

  // programmatically set value of header filter
  /**
   * Set a column header filter value.
   * @param {object} column Internal column.
   * @param {*} value Filter value.
   * @returns {void}
   */
  setHeaderFilterValue(column, value) {
    if (column) {
      if (column.modules.filter && column.modules.filter.headerElement) {
        this.generateHeaderFilterElement(column, value, true)
        column.modules.filter.success(value)
      } else {
        console.warn('Column Filter Error - No header filter set on column:', column.getField())
      }
    }
  }

  /**
   * Recreate a column header filter editor with its current value.
   * @param {object} column Internal column.
   * @returns {void}
   */
  reloadHeaderFilter(column) {
    if (column) {
      if (column.modules.filter && column.modules.filter.headerElement) {
        this.generateHeaderFilterElement(column, column.modules.filter.value, true)
      } else {
        console.warn('Column Filter Error - No header filter set on column:', column.getField())
      }
    }
  }

  /**
   * Refresh table data after filter changes.
   * @returns {void}
   */
  refreshFilter() {
    const left = this.table.rowManager.scrollLeft

    if (this.tableInitialized) {
      if (this.table.options.filterMode === 'remote') {
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
  }

  // check if the filters has changed since last use
  /**
   * Mark filters as changed and emit change event.
   * @returns {void}
   */
  trackChanges() {
    this.changed = true
    this.dispatch('filter-changed')
  }

  // check if the filters has changed since last use
  /**
   * Return and reset the changed flag.
   * @returns {boolean}
   */
  hasChanged() {
    const changed = this.changed
    this.changed = false
    return changed
  }

  // set standard filters
  /**
   * Replace active filters.
   * @param {*} field Field, callback, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @param {object} [params] Filter params.
   * @returns {void}
   */
  setFilter(field, type, value, params) {
    this.filterList = []

    if (!Array.isArray(field)) {
      field = [{ field, type, value, params }]
    }

    this.addFilter(field)
  }

  // add filter to array
  /**
   * Add filters to the active filter list.
   * @param {*} field Field, callback, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @param {object} [params] Filter params.
   * @returns {void}
   */
  addFilter(field, type, value, params) {
    let changed = false

    if (!Array.isArray(field)) {
      field = [{ field, type, value, params }]
    }

    field.forEach((filter) => {
      filter = this.findFilter(filter)

      if (filter) {
        this.filterList.push(filter)
        changed = true
      }
    })

    if (changed) {
      this.trackChanges()
    }
  }

  /**
   * Normalize a filter descriptor into an executable filter.
   * @param {*} filter Filter descriptor or group.
   * @returns {object|Array<object>|boolean}
   */
  findFilter(filter) {
    let column

    if (Array.isArray(filter)) {
      return this.findSubFilters(filter)
    }

    let filterFunc = false

    if (typeof filter.field === 'function') {
      filterFunc = (data) => {
        return filter.field(data, filter.type || {}) // pass params to custom filter function
      }
    } else {
      if (Filter.filters[filter.type]) {
        column = this.table.columnManager.getColumnByField(filter.field)

        if (column) {
          filterFunc = (data) => {
            return Filter.filters[filter.type](filter.value, column.getFieldValue(data), data, filter.params || {})
          }
        } else {
          filterFunc = (data) => {
            return Filter.filters[filter.type](filter.value, data[filter.field], data, filter.params || {})
          }
        }
      } else {
        console.warn('Filter Error - No such filter type found, ignoring: ', filter.type)
      }
    }

    filter.func = filterFunc

    return filter.func ? filter : false
  }

  /**
   * Normalize nested OR-filter groups.
   * @param {Array<object>} filters Nested filter descriptors.
   * @returns {Array<object>|boolean}
   */
  findSubFilters(filters) {
    const output = []

    filters.forEach((filter) => {
      filter = this.findFilter(filter)

      if (filter) {
        output.push(filter)
      }
    })

    return output.length ? output : false
  }

  // get all filters
  /**
   * Return active filters in API format.
   * @param {boolean} [all] Include header filters.
   * @param {boolean} [ajax] Normalize function types for remote mode.
   * @returns {Array<object>}
   */
  getFilters(all, ajax) {
    let output = []

    if (all) {
      output = this.getHeaderFilters()
    }

    if (ajax) {
      output.forEach((item) => {
        if (typeof item.type === 'function') {
          item.type = 'function'
        }
      })
    }

    output = output.concat(this.filtersToArray(this.filterList, ajax))

    return output
  }

  // filter to Object
  /**
   * Convert internal filter structures into plain objects.
   * @param {Array<object>} filterList Filter list.
   * @param {boolean} [ajax] Normalize function types for remote mode.
   * @returns {Array<object>}
   */
  filtersToArray(filterList, ajax) {
    const output = []

    filterList.forEach((filter) => {
      let item

      if (Array.isArray(filter)) {
        output.push(this.filtersToArray(filter, ajax))
      } else {
        item = { field: filter.field, type: filter.type, value: filter.value }

        if (ajax) {
          if (typeof item.type === 'function') {
            item.type = 'function'
          }
        }

        output.push(item)
      }
    })

    return output
  }

  // get all filters
  /**
   * Return active header filters in API format.
   * @returns {Array<object>}
   */
  getHeaderFilters() {
    const output = []

    for (const key in this.headerFilters) {
      output.push({ field: key, type: this.headerFilters[key].type, value: this.headerFilters[key].value })
    }

    return output
  }

  // remove filter from array
  /**
   * Remove matching filters from the active list.
   * @param {*} field Field, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @returns {void}
   */
  removeFilter(field, type, value) {
    if (!Array.isArray(field)) {
      field = [{ field, type, value }]
    }

    field.forEach((filter) => {
      const index =
        typeof filter.field === 'object'
          ? this.filterList.findIndex((element) => {
              return filter === element
            })
          : this.filterList.findIndex((element) => {
              return filter.field === element.field && filter.type === element.type && filter.value === element.value
            })

      if (index > -1) {
        this.filterList.splice(index, 1)
      } else {
        console.warn('Filter Error - No matching filter type found, ignoring: ', filter.type)
      }
    })

    this.trackChanges()
  }

  // clear filters
  /**
   * Clear all standard filters and optionally header filters.
   * @param {boolean} all Clear header filters as well.
   * @returns {void}
   */
  clearFilter(all) {
    this.filterList = []

    if (all) {
      this.clearHeaderFilter()
    }

    this.trackChanges()
  }

  // clear header filters
  /**
   * Clear all header filters and reset header filter editors.
   * @returns {void}
   */
  clearHeaderFilter() {
    this.headerFilters = {}
    this.prevHeaderFilterChangeCheck = '{}'

    this.headerFilterColumns.forEach((column) => {
      if (column.modules.filter.value !== undefined) {
        delete column.modules.filter.value
      }
      column.modules.filter.prevSuccess = undefined
      this.reloadHeaderFilter(column)
    })

    this.trackChanges()
  }

  // search data and return matching rows
  /**
   * Search row data with temporary filter criteria.
   * @param {'rows'|'data'} searchType Output type.
   * @param {*} field Field, callback, filter object, or array.
   * @param {*} type Filter type.
   * @param {*} value Filter value.
   * @returns {Array<object>}
   */
  search(searchType, field, type, value) {
    const activeRows = []
    const filterList = []

    if (!Array.isArray(field)) {
      field = [{ field, type, value }]
    }

    field.forEach((filter) => {
      filter = this.findFilter(filter)

      if (filter) {
        filterList.push(filter)
      }
    })

    this.table.rowManager.rows.forEach((row) => {
      let match = true

      filterList.forEach((filter) => {
        if (!this.filterRecurse(filter, row.getData())) {
          match = false
        }
      })

      if (match) {
        activeRows.push(searchType === 'data' ? row.getData('data') : row.getComponent())
      }
    })

    return activeRows
  }

  // filter row array
  /**
   * Filter row list using active standard and header filters.
   * @param {Array<object>} rowList Candidate row list.
   * @returns {Array<object>}
   */
  filter(rowList) {
    let activeRows = []
    const activeRowComponents = []

    if (this.subscribedExternal('dataFiltering')) {
      this.dispatchExternal('dataFiltering', this.getFilters(true))
    }

    if (
      this.table.options.filterMode !== 'remote' &&
      (this.filterList.length || Object.keys(this.headerFilters).length)
    ) {
      rowList.forEach((row) => {
        if (this.filterRow(row)) {
          activeRows.push(row)
        }
      })
    } else {
      activeRows = rowList.slice(0)
    }

    if (this.subscribedExternal('dataFiltered')) {
      activeRows.forEach((row) => {
        activeRowComponents.push(row.getComponent())
      })

      this.dispatchExternal('dataFiltered', this.getFilters(true), activeRowComponents)
    }

    return activeRows
  }

  // filter individual row
  /**
   * Check whether a single row matches active filters.
   * @param {object} row Internal row.
   * @returns {boolean}
   */
  filterRow(row) {
    let match = true
    const data = row.getData()

    this.filterList.forEach((filter) => {
      if (!this.filterRecurse(filter, data)) {
        match = false
      }
    })

    for (const field in this.headerFilters) {
      if (!this.headerFilters[field].func(data)) {
        match = false
      }
    }

    return match
  }

  /**
   * Evaluate a filter or nested filter group against row data.
   * @param {object|Array<object>} filter Filter descriptor or OR-group.
   * @param {object} data Row data.
   * @returns {boolean}
   */
  filterRecurse(filter, data) {
    let match = false

    if (Array.isArray(filter)) {
      filter.forEach((subFilter) => {
        if (this.filterRecurse(subFilter, data)) {
          match = true
        }
      })
    } else {
      match = filter.func(data)
    }

    return match
  }
}
