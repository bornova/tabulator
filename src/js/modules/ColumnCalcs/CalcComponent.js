export default class CalcComponent {
  constructor(row) {
    this._row = row

    return new Proxy(this, {
      get(target, name, receiver) {
        if (typeof name === 'symbol') {
          return Reflect.get(target, name, receiver)
        }

        if (typeof target[name] !== 'undefined') {
          return target[name]
        }

        return target._row.table.componentFunctionBinder.handle('row', target._row, name)
      }
    })
  }

  getData(transform) {
    return this._row.getData(transform)
  }

  getElement() {
    return this._row.getElement()
  }

  getTable() {
    return this._row.table
  }

  getCells() {
    return this._row.getCells().map((cell) => cell.getComponent())
  }

  getCell(column) {
    const cell = this._row.getCell(column)
    return cell ? cell.getComponent() : false
  }

  _getSelf() {
    return this._row
  }
}
