import Module from '../../core/Module.js'

export default class ReactiveData extends Module {
  static moduleName = 'reactiveData'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.data = false
    this.blocked = false // block reactivity while performing update
    this.origFuncs = {} // hold original data array functions to allow replacement after data is done with
    this.currentVersion = 0

    this.registerTableOption('reactiveData', false) // enable data reactivity
  }

  /**
   * Initialize reactive data subscriptions.
   * @returns {void}
   */
  initialize() {
    if (this.table.options.reactiveData) {
      this.subscribe('cell-value-save-before', this.block.bind(this, 'cellsave'))
      this.subscribe('cell-value-save-after', this.unblock.bind(this, 'cellsave'))
      this.subscribe('row-data-save-before', this.block.bind(this, 'rowsave'))
      this.subscribe('row-data-save-after', this.unblock.bind(this, 'rowsave'))
      this.subscribe('row-data-init-after', this.watchRow.bind(this))
      this.subscribe('row-deleting', this.unwatchRow.bind(this))
      this.subscribe('data-processing', this.watchData.bind(this))
      this.subscribe('table-destroy', this.unwatchData.bind(this))
    }
  }

  /**
   * Watch table data array and override mutating methods.
   * @param {Array<object>} data Active table data array.
   * @returns {void}
   */
  watchData(data) {
    const self = this
    let version

    this.currentVersion++

    version = this.currentVersion

    this.unwatchData()

    this.data = data

    // override array push function
    this.origFuncs.push = data.push

    Object.defineProperty(this.data, 'push', {
      enumerable: false,
      configurable: true,
      value: function () {
        const args = Array.from(arguments)
        let result

        if (!self.blocked && version === self.currentVersion) {
          self.block('data-push')

          args.forEach((arg) => {
            self.table.rowManager.addRowActual(arg, false)
          })

          result = self.origFuncs.push.apply(data, arguments)

          self.unblock('data-push')
        }

        return result
      }
    })

    // override array unshift function
    this.origFuncs.unshift = data.unshift

    Object.defineProperty(this.data, 'unshift', {
      enumerable: false,
      configurable: true,
      value: function () {
        const args = Array.from(arguments)
        let result

        if (!self.blocked && version === self.currentVersion) {
          self.block('data-unshift')

          args.forEach((arg) => {
            self.table.rowManager.addRowActual(arg, true)
          })

          result = self.origFuncs.unshift.apply(data, arguments)

          self.unblock('data-unshift')
        }

        return result
      }
    })

    // override array shift function
    this.origFuncs.shift = data.shift

    Object.defineProperty(this.data, 'shift', {
      enumerable: false,
      configurable: true,
      value: function () {
        let row, result

        if (!self.blocked && version === self.currentVersion) {
          self.block('data-shift')

          if (self.data.length) {
            row = self.table.rowManager.getRowFromDataObject(self.data[0])

            if (row) {
              row.deleteActual()
            }
          }

          result = self.origFuncs.shift.call(data)

          self.unblock('data-shift')
        }

        return result
      }
    })

    // override array pop function
    this.origFuncs.pop = data.pop

    Object.defineProperty(this.data, 'pop', {
      enumerable: false,
      configurable: true,
      value: function () {
        let row, result

        if (!self.blocked && version === self.currentVersion) {
          self.block('data-pop')

          if (self.data.length) {
            row = self.table.rowManager.getRowFromDataObject(self.data[self.data.length - 1])

            if (row) {
              row.deleteActual()
            }
          }

          result = self.origFuncs.pop.call(data)

          self.unblock('data-pop')
        }

        return result
      }
    })

    // override array splice function
    this.origFuncs.splice = data.splice

    Object.defineProperty(this.data, 'splice', {
      enumerable: false,
      configurable: true,
      value: function () {
        const args = Array.from(arguments)
        const start = args[0] < 0 ? data.length + args[0] : args[0]
        const end = args[1]
        let newRows = args[2] ? args.slice(2) : false
        let startRow
        let result

        if (!self.blocked && version === self.currentVersion) {
          self.block('data-splice')
          // add new rows
          if (newRows) {
            startRow = data[start] ? self.table.rowManager.getRowFromDataObject(data[start]) : false

            if (startRow) {
              newRows.forEach((rowData) => {
                self.table.rowManager.addRowActual(rowData, true, startRow, true)
              })
            } else {
              newRows = newRows.slice().reverse()

              newRows.forEach((rowData) => {
                self.table.rowManager.addRowActual(rowData, true, false, true)
              })
            }
          }

          // delete removed rows
          if (end !== 0) {
            const oldRows = data.slice(start, typeof args[1] === 'undefined' ? args[1] : start + end)

            oldRows.forEach((rowData, i) => {
              const row = self.table.rowManager.getRowFromDataObject(rowData)

              if (row) {
                row.deleteActual(i !== oldRows.length - 1)
              }
            })
          }

          if (newRows || end !== 0) {
            self.table.rowManager.reRenderInPosition()
          }

          result = self.origFuncs.splice.apply(data, arguments)

          self.unblock('data-splice')
        }

        return result
      }
    })
  }

  /**
   * Restore original array mutator methods.
   * @returns {void}
   */
  unwatchData() {
    if (this.data !== false) {
      for (const key in this.origFuncs) {
        Object.defineProperty(this.data, key, {
          enumerable: true,
          configurable: true,
          writable: true,
          value: this.origFuncs[key]
        })
      }

      this.origFuncs = {}
      this.data = false
    }
  }

  /**
   * Watch row data object keys for reactive updates.
   * @param {object} row Internal row.
   * @returns {void}
   */
  watchRow(row) {
    const data = row.getData()

    for (const key in data) {
      this.watchKey(row, data, key)
    }

    if (this.table.options.dataTree) {
      this.watchTreeChildren(row)
    }
  }

  /**
   * Watch data tree child array mutators for a row.
   * @param {object} row Internal row.
   * @returns {void}
   */
  watchTreeChildren(row) {
    const childField = row.getData()[this.table.options.dataTreeChildField]
    const origFuncs = {}

    const bindTreeArrayMethod = (methodName, blockKey, invoke) => {
      origFuncs[methodName] = childField[methodName]

      Object.defineProperty(childField, methodName, {
        enumerable: false,
        configurable: true,
        value: (...args) => {
          let result

          if (!this.blocked) {
            this.block(blockKey)

            result = invoke(origFuncs[methodName], args)
            this.rebuildTree(row)

            this.unblock(blockKey)
          }

          return result
        }
      })
    }

    if (childField) {
      bindTreeArrayMethod('push', 'tree-push', (method, args) => method.apply(childField, args))
      bindTreeArrayMethod('unshift', 'tree-unshift', (method, args) => method.apply(childField, args))
      bindTreeArrayMethod('shift', 'tree-shift', (method) => method.call(childField))
      bindTreeArrayMethod('pop', 'tree-pop', (method) => method.call(childField))
      bindTreeArrayMethod('splice', 'tree-splice', (method, args) => method.apply(childField, args))
    }
  }

  /**
   * Rebuild tree after reactive child updates.
   * @param {object} row Internal row.
   * @returns {void}
   */
  rebuildTree(row) {
    this.table.modules.dataTree.initializeRow(row)
    this.table.modules.dataTree.layoutRow(row)
    this.table.rowManager.refreshActiveData('tree', false, true)
  }

  /**
   * Watch one data key for direct assignment updates.
   * @param {object} row Internal row.
   * @param {object} data Row data object.
   * @param {string} key Data key.
   * @returns {void}
   */
  watchKey(row, data, key) {
    const self = this
    const props = Object.getOwnPropertyDescriptor(data, key)
    let value = data[key]
    const version = this.currentVersion

    Object.defineProperty(data, key, {
      configurable: true,
      enumerable: true,
      set: (newValue) => {
        value = newValue
        if (!self.blocked && version === self.currentVersion) {
          self.block('key')

          const update = {}
          update[key] = newValue
          row.updateData(update)

          self.unblock('key')
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

  /**
   * Remove reactive accessors from row data keys.
   * @param {object} row Internal row.
   * @returns {void}
   */
  unwatchRow(row) {
    const data = row.getData()

    for (const key in data) {
      Object.defineProperty(data, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: data[key]
      })
    }
  }

  /**
   * Set reactivity block flag.
   * @param {string} key Block key.
   * @returns {void}
   */
  block(key) {
    if (!this.blocked) {
      this.blocked = key
    }
  }

  /**
   * Clear reactivity block flag.
   * @param {string} key Block key.
   * @returns {void}
   */
  unblock(key) {
    if (this.blocked === key) {
      this.blocked = false
    }
  }
}
