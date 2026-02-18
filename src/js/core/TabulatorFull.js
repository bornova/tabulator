// tabulator with all modules installed
import Tabulator from './Tabulator.js'
import * as allModules from '../core/modules/optional.js'

class TabulatorFull extends Tabulator {
  static extendModule(...args) {
    Tabulator.initializeModuleBinder(allModules)
    Tabulator._extendModule(...args)
  }

  static registerModule(...args) {
    Tabulator.initializeModuleBinder(allModules)
    Tabulator._registerModule(...args)
  }

  constructor(element, options, modules) {
    super(element, options, allModules)
  }
}

export default TabulatorFull
