import Module from '../../core/Module.js'
import extensions from './extensions/extensions.js'

export default class SelectRow extends Module {
  static moduleName = 'selectRow'
  static moduleExtensions = extensions

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.selecting = false // flag selecting in progress
    this.lastClickedRow = false // last clicked row
    this.selectPrev = [] // hold previously selected element for drag drop selection
    this.selectedRows = [] // hold selected rows
    this.headerCheckboxElement = null // hold header select element

    this.registerTableOption('selectableRows', 'highlight') // highlight rows on hover
    this.registerTableOption('selectableRowsRangeMode', 'drag') // highlight rows on hover
    this.registerTableOption('selectableRowsRollingSelection', true) // roll selection once maximum number of selectable rows is reached
    this.registerTableOption('selectableRowsPersistence', true) // maintain selection when table view is updated
    this.registerTableOption('selectableRowsCheck', function (data, row) {
      void data
      void row
      return true
    }) // check whether row is selectable

    this.registerTableFunction('selectRow', this.selectRows.bind(this))
    this.registerTableFunction('deselectRow', this.deselectRows.bind(this))
    this.registerTableFunction('toggleSelectRow', this.toggleRow.bind(this))
    this.registerTableFunction('getSelectedRows', this.getSelectedRows.bind(this))
    this.registerTableFunction('getSelectedData', this.getSelectedData.bind(this))

    // register component functions
    this.registerComponentFunction('row', 'select', this.selectRows.bind(this))
    this.registerComponentFunction('row', 'deselect', this.deselectRows.bind(this))
    this.registerComponentFunction('row', 'toggleSelect', this.toggleRow.bind(this))
    this.registerComponentFunction('row', 'isSelected', this.isRowSelected.bind(this))
  }

  /**
   * Initialize row selection behavior and subscriptions.
   * @returns {void}
   */
  initialize() {
    this.deprecatedOptionsCheck()

    if (this.table.options.selectableRows === 'highlight' && this.table.options.selectableRange) {
      this.table.options.selectableRows = false
    }

    if (this.table.options.selectableRows !== false) {
      this.subscribe('row-init', this.initializeRow.bind(this))
      this.subscribe('row-deleting', this.rowDeleted.bind(this))
      this.subscribe('rows-wipe', this.clearSelectionData.bind(this))
      this.subscribe('rows-retrieve', this.rowRetrieve.bind(this))

      if (this.table.options.selectableRows && !this.table.options.selectableRowsPersistence) {
        this.subscribe('data-refreshing', this.deselectRows.bind(this))
      }
    }
  }

  /**
   * Check deprecated selection options.
   * @returns {void}
   */
  deprecatedOptionsCheck() {
    // this.deprecationCheck("selectable", "selectableRows", true);
    // this.deprecationCheck("selectableRollingSelection", "selectableRowsRollingSelection", true);
    // this.deprecationCheck("selectableRangeMode", "selectableRowsRangeMode", true);
    // this.deprecationCheck("selectablePersistence", "selectableRowsPersistence", true);
    // this.deprecationCheck("selectableCheck", "selectableRowsCheck", true);
  }

  /**
   * Expose selected rows to row retrieval pipeline.
   * @param {string} type Retrieval type.
   * @param {*} prevValue Previous value.
   * @returns {*}
   */
  rowRetrieve(type, prevValue) {
    return type === 'selected' ? this.selectedRows : prevValue
  }

  /**
   * Deselect row when it is deleted.
   * @param {object} row Internal row.
   * @returns {void}
   */
  rowDeleted(row) {
    this._deselectRow(row, true)
  }

  /**
   * Clear all selection state.
   * @param {boolean} [silent] Suppress selection changed event.
   * @returns {void}
   */
  clearSelectionData(silent) {
    const prevSelected = this.selectedRows.length

    this.selecting = false
    this.lastClickedRow = false
    this.selectPrev = []
    this.selectedRows = []

    if (prevSelected && silent !== true) {
      this._rowSelectionChanged()
    }
  }

  /**
   * Initialize selection listeners and classes for a row.
   * @param {object} row Internal row.
   * @returns {void}
   */
  initializeRow(row) {
    const self = this
    const selectable = self.checkRowSelectability(row)
    const element = row.getElement()

    // trigger end of row selection
    const endSelect = function () {
      setTimeout(function () {
        self.selecting = false
      }, 50)

      document.body.removeEventListener('mouseup', endSelect)
    }

    row.modules.select = { selected: false }

    element.classList.toggle('tabulator-selectable', selectable)
    element.classList.toggle('tabulator-unselectable', !selectable)

    // set row selection class
    if (selectable) {
      if (self.table.options.selectableRows && self.table.options.selectableRows !== 'highlight') {
        if (self.table.options.selectableRowsRangeMode === 'click') {
          element.addEventListener('click', this.handleComplexRowClick.bind(this, row))
        } else {
          element.addEventListener('click', () => {
            if (!self.table.modExists('edit') || !self.table.modules.edit.getCurrentCell()) {
              self.table._clearSelection()
            }

            if (!self.selecting) {
              self.toggleRow(row)
            }
          })

          element.addEventListener('mousedown', (e) => {
            if (e.shiftKey) {
              self.table._clearSelection()

              self.selecting = true

              self.selectPrev = []

              document.body.addEventListener('mouseup', endSelect)
              document.body.addEventListener('keyup', endSelect)

              self.toggleRow(row)

              return false
            }
          })

          element.addEventListener('mouseenter', () => {
            if (self.selecting) {
              self.table._clearSelection()
              self.toggleRow(row)

              if (self.selectPrev[1] === row) {
                self.toggleRow(self.selectPrev[0])
              }
            }
          })

          element.addEventListener('mouseout', () => {
            if (self.selecting) {
              self.table._clearSelection()
              self.selectPrev.unshift(row)
            }
          })
        }
      }
    }
  }

  /**
   * Handle range/cmd selection row click behavior.
   * @param {object} row Internal row.
   * @param {MouseEvent} e Mouse event.
   * @returns {void}
   */
  handleComplexRowClick(row, e) {
    if (e.shiftKey) {
      this.table._clearSelection()
      this.lastClickedRow = this.lastClickedRow || row

      const lastClickedRowIdx = this.table.rowManager.getDisplayRowIndex(this.lastClickedRow)
      const rowIdx = this.table.rowManager.getDisplayRowIndex(row)

      const fromRowIdx = lastClickedRowIdx <= rowIdx ? lastClickedRowIdx : rowIdx
      const toRowIdx = lastClickedRowIdx >= rowIdx ? lastClickedRowIdx : rowIdx

      const rows = this.table.rowManager.getDisplayRows()
      let toggledRows = rows.slice(fromRowIdx, toRowIdx + 1)

      if (e.ctrlKey || e.metaKey) {
        toggledRows.forEach((toggledRow) => {
          if (toggledRow !== this.lastClickedRow) {
            if (this.table.options.selectableRows !== true && !this.isRowSelected(row)) {
              if (this.selectedRows.length < this.table.options.selectableRows) {
                this.toggleRow(toggledRow)
              }
            } else {
              this.toggleRow(toggledRow)
            }
          }
        })
        this.lastClickedRow = row
      } else {
        this.deselectRows(undefined, true)

        if (this.table.options.selectableRows !== true) {
          if (toggledRows.length > this.table.options.selectableRows) {
            toggledRows = toggledRows.slice(0, this.table.options.selectableRows)
          }
        }

        this.selectRows(toggledRows)
      }
      this.table._clearSelection()
    } else if (e.ctrlKey || e.metaKey) {
      this.toggleRow(row)
      this.lastClickedRow = row
    } else {
      this.deselectRows(undefined, true)
      this.selectRows(row)
      this.lastClickedRow = row
    }
  }

  /**
   * Determine if a row can be selected.
   * @param {object} row Internal row.
   * @returns {boolean}
   */
  checkRowSelectability(row) {
    if (row && row.type === 'row') {
      return this.table.options.selectableRowsCheck.call(this.table, row.getComponent())
    }

    return false
  }

  /**
   * Toggle selected state of a row.
   * @param {*} row Row lookup.
   * @returns {void}
   */
  toggleRow(row) {
    if (this.checkRowSelectability(row)) {
      if (row.modules.select && row.modules.select.selected) {
        this._deselectRow(row)
      } else {
        this._selectRow(row)
      }
    }
  }

  /**
   * Select one or more rows.
   * @param {*} rows Row lookup(s).
   * @returns {void}
   */
  selectRows(rows) {
    const changes = []
    let rowMatch
    let change

    switch (typeof rows) {
      case 'undefined':
        rowMatch = this.table.rowManager.rows
        break

      case 'number':
        rowMatch = this.table.rowManager.findRow(rows)
        break

      case 'string':
        rowMatch = this.table.rowManager.findRow(rows)

        if (!rowMatch) {
          rowMatch = this.table.rowManager.getRows(rows)
        }
        break

      default:
        rowMatch = rows
        break
    }

    if (Array.isArray(rowMatch)) {
      if (rowMatch.length) {
        rowMatch.forEach((row) => {
          change = this._selectRow(row, true, true)

          if (change) {
            changes.push(change)
          }
        })

        this._rowSelectionChanged(false, changes)
      }
      return
    }

    if (rowMatch) {
      this._selectRow(rowMatch, false, true)
    }
  }

  /**
   * Select an individual row.
   * @param {*} rowInfo Row lookup.
   * @param {boolean} [silent] Suppress changed event.
   * @param {boolean} [force] Ignore max selection limits.
   * @returns {object|false|undefined}
   */
  _selectRow(rowInfo, silent, force) {
    // handle max row count
    if (!isNaN(this.table.options.selectableRows) && this.table.options.selectableRows !== true && !force) {
      if (this.selectedRows.length >= this.table.options.selectableRows) {
        if (this.table.options.selectableRowsRollingSelection) {
          this._deselectRow(this.selectedRows[0])
        } else {
          return false
        }
      }
    }

    const row = this.table.rowManager.findRow(rowInfo)

    if (row) {
      if (this.selectedRows.indexOf(row) === -1) {
        row.getElement().classList.add('tabulator-selected')
        if (!row.modules.select) {
          row.modules.select = {}
        }

        row.modules.select.selected = true
        if (row.modules.select.checkboxEl) {
          row.modules.select.checkboxEl.checked = true
        }

        this.selectedRows.push(row)

        if (this.table.options.dataTreeSelectPropagate) {
          this.childRowSelection(row, true)
        }

        this.dispatchExternal('rowSelected', row.getComponent())

        this._rowSelectionChanged(silent, row)

        return row
      }
    } else {
      if (!silent) {
        console.warn(`Selection Error - No such row found, ignoring selection:${rowInfo}`)
      }
    }
  }

  /**
   * Check if a row is selected.
   * @param {object} row Internal row.
   * @returns {boolean}
   */
  isRowSelected(row) {
    return this.selectedRows.indexOf(row) !== -1
  }

  /**
   * Deselect one or more rows.
   * @param {*} rows Row lookup(s).
   * @param {boolean} [silent] Suppress changed event.
   * @returns {void}
   */
  deselectRows(rows, silent) {
    const changes = []
    let rowMatch
    let change

    switch (typeof rows) {
      case 'undefined':
        rowMatch = Object.assign([], this.selectedRows)
        break

      case 'number':
        rowMatch = this.table.rowManager.findRow(rows)
        break

      case 'string':
        rowMatch = this.table.rowManager.findRow(rows)

        if (!rowMatch) {
          rowMatch = this.table.rowManager.getRows(rows)
        }
        break

      default:
        rowMatch = rows
        break
    }

    if (Array.isArray(rowMatch)) {
      if (rowMatch.length) {
        rowMatch.forEach((row) => {
          change = this._deselectRow(row, true, true)

          if (change) {
            changes.push(change)
          }
        })

        this._rowSelectionChanged(silent, [], changes)
      }
      return
    }

    if (rowMatch) {
      this._deselectRow(rowMatch, silent, true)
    }
  }

  /**
   * Deselect an individual row.
   * @param {*} rowInfo Row lookup.
   * @param {boolean} [silent] Suppress changed event.
   * @returns {object|undefined}
   */
  _deselectRow(rowInfo, silent) {
    const row = this.table.rowManager.findRow(rowInfo)
    let index
    let element

    if (row) {
      index = this.selectedRows.findIndex((selectedRow) => selectedRow === row)

      if (index > -1) {
        element = row.getElement()

        if (element) {
          element.classList.remove('tabulator-selected')
        }

        if (!row.modules.select) {
          row.modules.select = {}
        }

        row.modules.select.selected = false
        if (row.modules.select.checkboxEl) {
          row.modules.select.checkboxEl.checked = false
        }
        this.selectedRows.splice(index, 1)

        if (this.table.options.dataTreeSelectPropagate) {
          this.childRowSelection(row, false)
        }

        this.dispatchExternal('rowDeselected', row.getComponent())

        this._rowSelectionChanged(silent, undefined, row)

        return row
      }
    } else {
      if (!silent) {
        console.warn(`Deselection Error - No such row found, ignoring selection:${rowInfo}`)
      }
    }
  }

  /**
   * Get selected row data objects.
   * @returns {Array<object>}
   */
  getSelectedData() {
    return this.selectedRows.map((row) => row.getData())
  }

  /**
   * Get selected row components.
   * @returns {Array<object>}
   */
  getSelectedRows() {
    return this.selectedRows.map((row) => row.getComponent())
  }

  /**
   * Dispatch selection changed event and sync header checkbox state.
   * @param {boolean} [silent] Suppress external event.
   * @param {object|Array<object>} [selected=[]] Newly selected rows.
   * @param {object|Array<object>} [deselected=[]] Newly deselected rows.
   * @returns {void}
   */
  _rowSelectionChanged(silent, selected = [], deselected = []) {
    if (this.headerCheckboxElement) {
      if (this.selectedRows.length === 0) {
        this.headerCheckboxElement.checked = false
        this.headerCheckboxElement.indeterminate = false
      } else if (this.table.rowManager.rows.length === this.selectedRows.length) {
        this.headerCheckboxElement.checked = true
        this.headerCheckboxElement.indeterminate = false
      } else {
        this.headerCheckboxElement.indeterminate = true
        this.headerCheckboxElement.checked = false
      }
    }

    if (!silent) {
      if (!Array.isArray(selected)) {
        selected = [selected]
      }

      selected = selected.filter((row) => row).map((row) => row.getComponent())

      if (!Array.isArray(deselected)) {
        deselected = [deselected]
      }

      deselected = deselected.filter((row) => row).map((row) => row.getComponent())

      this.dispatchExternal('rowSelectionChanged', this.getSelectedData(), this.getSelectedRows(), selected, deselected)
    }
  }

  /**
   * Register checkbox element for a row component.
   * @param {object} row Row component.
   * @param {HTMLInputElement} element Checkbox element.
   * @returns {void}
   */
  registerRowSelectCheckbox(row, element) {
    if (!row._row.modules.select) {
      row._row.modules.select = {}
    }

    row._row.modules.select.checkboxEl = element
  }

  /**
   * Register header select-all checkbox element.
   * @param {HTMLInputElement} element Checkbox element.
   * @returns {void}
   */
  registerHeaderSelectCheckbox(element) {
    this.headerCheckboxElement = element
  }

  /**
   * Propagate selection state to data tree children.
   * @param {object} row Internal row.
   * @param {boolean} select Selection state to apply.
   * @returns {void}
   */
  childRowSelection(row, select) {
    const dataTree = this.table.modules.dataTree

    if (!dataTree || !row || !row.modules || !row.modules.dataTree) {
      return
    }

    const children = dataTree.getChildren(row, true, true)

    if (select) {
      for (const child of children) {
        this._selectRow(child, true)
      }
    } else {
      for (const child of children) {
        this._deselectRow(child, true)
      }
    }
  }
}
