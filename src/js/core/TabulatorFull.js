// tabulator with all modules installed
import Tabulator from './Tabulator.js'
import * as allModules from '../core/modules/optional.js'

class TabulatorFull extends Tabulator {
  /**
   * Initialize module binder with all optional modules.
   */
  static initializeAllModules() {
    Tabulator.initializeModuleBinder(allModules)
  }

  /**
   * Extend an installed module namespace on the full build.
   * @param {...*} args Extension arguments.
   */
  static extendModule(...args) {
    TabulatorFull.initializeAllModules()
    Tabulator._extendModule(...args)
  }

  /**
   * Register additional module(s) on the full build.
   * @param {...*} args Module registration arguments.
   */
  static registerModule(...args) {
    TabulatorFull.initializeAllModules()
    Tabulator._registerModule(...args)
  }

  /**
   * @param {HTMLElement|string} element Target element or selector.
   * @param {object} options Table options.
   */
  constructor(element, options) {
    super(element, options, allModules)
  }
}

export default TabulatorFull
