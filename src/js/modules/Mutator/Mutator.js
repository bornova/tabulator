import Module from '../../core/Module.js'

import defaultMutators from './defaults/mutators.js'

export default class Mutator extends Module {
  static moduleName = 'mutator'

  // load defaults
  static mutators = defaultMutators

  static keyPrefix = 'mutator'

  constructor(table) {
    super(table)

    this.allowedTypes = ['', 'data', 'edit', 'clipboard', 'import'] // list of mutation types
    this.enabled = true

    this.registerColumnOption('mutator')
    this.registerColumnOption('mutatorParams')
    this.registerColumnOption('mutatorData')
    this.registerColumnOption('mutatorDataParams')
    this.registerColumnOption('mutatorEdit')
    this.registerColumnOption('mutatorEditParams')
    this.registerColumnOption('mutatorClipboard')
    this.registerColumnOption('mutatorClipboardParams')
    this.registerColumnOption('mutatorImport')
    this.registerColumnOption('mutatorImportParams')
    this.registerColumnOption('mutateLink')
  }

  initialize() {
    this.subscribe('cell-value-changing', this.transformCell.bind(this))
    this.subscribe('cell-value-changed', this.mutateLink.bind(this))
    this.subscribe('column-layout', this.initializeColumn.bind(this))
    this.subscribe('row-data-init-before', this.rowDataChanged.bind(this))
    this.subscribe('row-data-changing', this.rowDataChanged.bind(this))
  }

  rowDataChanged(row, tempData, updatedData) {
    return this.transformRow(tempData, 'data', updatedData)
  }

  // initialize column mutator
  initializeColumn(column) {
    let match = false
    const config = {}

    this.allowedTypes.forEach((type) => {
      const key = `${Mutator.keyPrefix}${type.charAt(0).toUpperCase()}${type.slice(1)}`
      let mutator

      if (column.definition[key]) {
        mutator = this.lookupMutator(column.definition[key])

        if (mutator) {
          match = true

          config[key] = {
            mutator,
            params: column.definition[`${key}Params`] || {}
          }
        }
      }
    })

    if (match) {
      column.modules.mutate = config
    }
  }

  lookupMutator(value) {
    // set column mutator
    switch (typeof value) {
      case 'string':
        if (Mutator.mutators[value]) {
          return Mutator.mutators[value]
        }

        console.warn('Mutator Error - No such mutator found, ignoring: ', value)
        return false

      case 'function':
        return value

      default:
        return false
    }
  }

  // apply mutator to row
  transformRow(data, type, updatedData) {
    const key = `${Mutator.keyPrefix}${type.charAt(0).toUpperCase()}${type.slice(1)}`
    const sourceData = typeof updatedData !== 'undefined' ? updatedData : data

    if (!this.enabled) {
      return data
    }

    this.table.columnManager.traverse((column) => {
      if (!column.modules.mutate) {
        return
      }

      const mutator = column.modules.mutate[key] || column.modules.mutate.mutator || false

      if (!mutator) {
        return
      }

      const value = column.getFieldValue(sourceData)

      if ((type === 'data' && !updatedData) || typeof value !== 'undefined') {
        const component = column.getComponent()
        const params =
          typeof mutator.params === 'function' ? mutator.params(value, data, type, component) : mutator.params

        column.setFieldValue(data, mutator.mutator(value, data, type, params, component))
      }
    })

    return data
  }

  // apply mutator to new cell value
  transformCell(cell, value) {
    if (!cell.column.modules.mutate) {
      return value
    }

    const mutator = cell.column.modules.mutate.mutatorEdit || cell.column.modules.mutate.mutator || false

    if (mutator) {
      const tempData = { ...cell.row.getData() }

      cell.column.setFieldValue(tempData, value)
      return mutator.mutator(value, tempData, 'edit', mutator.params, cell.getComponent())
    }

    return value
  }

  mutateLink(cell) {
    let links = cell.column.definition.mutateLink

    if (links) {
      if (!Array.isArray(links)) {
        links = [links]
      }

      links.forEach((link) => {
        const linkCell = cell.row.getCell(link)

        if (linkCell) {
          linkCell.setValue(linkCell.getValue(), true, true)
        }
      })
    }
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }
}
