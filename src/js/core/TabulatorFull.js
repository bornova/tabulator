// tabulator with all modules installed
import Tabulator from './Tabulator.js'
import * as allModules from '../core/modules/optional.js'

class TabulatorFull extends Tabulator {
  /**
   * Extend an installed module namespace on the full build.
   * @param {...*} args Extension arguments.
   * @returns {void}
   */
  static extendModule(...args) {
    Tabulator.initializeModuleBinder(allModules)
    Tabulator._extendModule(...args)
  }

  /**
   * Register additional module(s) on the full build.
   * @param {...*} args Module registration arguments.
   * @returns {void}
   */
  static registerModule(...args) {
    Tabulator.initializeModuleBinder(allModules)
    Tabulator._registerModule(...args)
  }

  /**
   * @param {HTMLElement|string} element Target element or selector.
   * @param {object} options Table options.
   * @param {Array<Function>} [modules] Ignored in full build.
   */
  constructor(element, options, modules) {
    super(element, options, allModules)
  }
}

export default TabulatorFull
