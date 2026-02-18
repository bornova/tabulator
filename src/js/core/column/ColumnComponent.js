// public column object
export default class ColumnComponent {
  constructor(column) {
    this._column = column
    this.type = 'ColumnComponent'

    return new Proxy(this, {
      get(target, name, receiver) {
        if (typeof name === 'symbol') {
          return Reflect.get(target, name, receiver)
        }

        if (typeof target[name] !== 'undefined') {
          return target[name]
        }

        return target._column.table.componentFunctionBinder.handle('column', target._column, name)
      }
    })
  }

  getElement() {
    return this._column.getElement()
  }

  getDefinition() {
    return this._column.getDefinition()
  }

  getField() {
    return this._column.getField()
  }

  getTitleDownload() {
    return this._column.getTitleDownload()
  }

  getCells() {
    return this._column.cells.map((cell) => cell.getComponent())
  }

  isVisible() {
    return this._column.visible
  }

  show() {
    if (this._column.isGroup) {
      this._column.columns.forEach((column) => {
        column.show()
      })
    } else {
      this._column.show()
    }
  }

  hide() {
    if (this._column.isGroup) {
      this._column.columns.forEach((column) => {
        column.hide()
      })
    } else {
      this._column.hide()
    }
  }

  toggle() {
    this._column.visible ? this.hide() : this.show()
  }

  delete() {
    return this._column.delete()
  }

  getSubColumns() {
    return this._column.columns.map((column) => column.getComponent())
  }

  getParentColumn() {
    return this._column.getParentComponent()
  }

  _getSelf() {
    return this._column
  }

  scrollTo(position, ifVisible) {
    return this._column.table.columnManager.scrollToColumn(this._column, position, ifVisible)
  }

  getTable() {
    return this._column.table
  }

  move(to, after) {
    const toColumn = this._column.table.columnManager.findColumn(to)

    if (toColumn) {
      this._column.table.columnManager.moveColumn(this._column, toColumn, after)
    } else {
      console.warn('Move Error - No matching column found:', toColumn)
    }
  }

  getNextColumn() {
    const nextCol = this._column.nextColumn()

    return nextCol ? nextCol.getComponent() : false
  }

  getPrevColumn() {
    const prevCol = this._column.prevColumn()

    return prevCol ? prevCol.getComponent() : false
  }

  updateDefinition(updates) {
    return this._column.updateDefinition(updates)
  }

  getWidth() {
    return this._column.getWidth()
  }

  setWidth(width) {
    const result = width === true ? this._column.reinitializeWidth(true) : this._column.setWidth(width)

    this._column.table.columnManager.rerenderColumns(true)

    return result
  }
}
