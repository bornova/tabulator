import Module from '../../core/Module.js'
import Row from '../../core/row/Row.js'
import Cell from '../../core/cell/Cell.js'

import defaultUndoers from './defaults/undoers.js'
import defaultRedoers from './defaults/redoers.js'
import extensions from './extensions/extensions.js'

export default class History extends Module {
  static moduleName = 'history'
  static moduleExtensions = extensions

  // load defaults
  static undoers = defaultUndoers
  static redoers = defaultRedoers

  constructor(table) {
    super(table)

    this.history = []
    this.index = -1

    this.registerTableOption('history', false) // enable edit history
  }

  initialize() {
    if (this.table.options.history) {
      this.subscribe('cell-value-updated', this.cellUpdated.bind(this))
      this.subscribe('cell-delete', this.clearComponentHistory.bind(this))
      this.subscribe('row-delete', this.rowDeleted.bind(this))
      this.subscribe('rows-wipe', this.clear.bind(this))
      this.subscribe('row-added', this.rowAdded.bind(this))
      this.subscribe('row-move', this.rowMoved.bind(this))
    }

    this.registerTableFunction('undo', this.undo.bind(this))
    this.registerTableFunction('redo', this.redo.bind(this))
    this.registerTableFunction('getHistoryUndoSize', this.getHistoryUndoSize.bind(this))
    this.registerTableFunction('getHistoryRedoSize', this.getHistoryRedoSize.bind(this))
    this.registerTableFunction('clearHistory', this.clear.bind(this))
  }

  rowMoved(from, to, after) {
    this.action('rowMove', from, { posFrom: from.getPosition(), posTo: to.getPosition(), to, after })
  }

  rowAdded(row, data, pos, index) {
    this.action('rowAdd', row, { data, pos, index })
  }

  rowDeleted(row) {
    let index

    if (this.table.options.groupBy) {
      const rows = row.getComponent().getGroup()._getSelf().rows
      index = rows.indexOf(row)

      if (index > 0) {
        index = rows[index - 1]
      }
    } else {
      index = row.table.rowManager.getRowIndex(row)

      if (index > 0) {
        index = row.table.rowManager.rows[index - 1]
      }
    }

    this.action('rowDelete', row, { data: row.getData(), pos: !index, index })
  }

  cellUpdated(cell) {
    this.action('cellEdit', cell, { oldValue: cell.oldValue, newValue: cell.value })
  }

  clear() {
    this.history = []
    this.index = -1
  }

  action(type, component, data) {
    this.history = this.history.slice(0, this.index + 1)

    this.history.push({
      type,
      component,
      data
    })

    this.index++
  }

  getHistoryUndoSize() {
    return this.index + 1
  }

  getHistoryRedoSize() {
    return this.history.length - (this.index + 1)
  }

  clearComponentHistory(component) {
    while (true) {
      const index = this.history.findIndex((item) => item.component === component)

      if (index === -1) {
        break
      }

      this.history.splice(index, 1)

      if (index <= this.index) {
        this.index--
      }
    }
  }

  undo() {
    if (this.index < 0) {
      console.warn(
        this.options('history') ? 'History Undo Error - No more history to undo' : 'History module not enabled'
      )
      return false
    }

    const action = this.history[this.index]

    History.undoers[action.type].call(this, action)

    this.index--

    this.dispatchExternal('historyUndo', action.type, action.component.getComponent(), action.data)

    return true
  }

  redo() {
    if (this.history.length - 1 <= this.index) {
      console.warn(
        this.options('history') ? 'History Redo Error - No more history to redo' : 'History module not enabled'
      )
      return false
    }

    this.index++

    const action = this.history[this.index]

    History.redoers[action.type].call(this, action)

    this.dispatchExternal('historyRedo', action.type, action.component.getComponent(), action.data)

    return true
  }

  // rebind rows to new element after deletion
  _rebindRow(oldRow, newRow) {
    this.history.forEach((action) => {
      if (action.component instanceof Row && action.component === oldRow) {
        action.component = newRow
        return
      }

      if (action.component instanceof Cell && action.component.row === oldRow) {
        const field = action.component.column.getField()

        if (field) {
          action.component = newRow.getCell(field)
        }
      }
    })
  }
}
