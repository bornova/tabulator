import CoreFeature from '../CoreFeature'

export default class Logger extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)
  }

  /**
   * Log a warning message to the console if warnings are enabled.
   * @param {string} msg Message to log.
   * @param {...*} args Additional arguments.
   */
  warn(msg, ...args) {
    if (this.table.options.debugLogging !== false) {
      console.warn(`Tabulator Warning - ${msg}`, ...args)
    }
  }

  /**
   * Log an error message to the console.
   * @param {string} msg Message to log.
   * @param {...*} args Additional arguments.
   */
  error(msg, ...args) {
    console.error(`Tabulator Error - ${msg}`, ...args)
  }

  /**
   * Log an info/debug message to the console if debug is enabled.
   * @param {string} msg Message to log.
   * @param {...*} args Additional arguments.
   */
  info(msg, ...args) {
    if (this.table.options.debugLogging === 'info' || this.table.options.debugLogging === 'debug') {
      console.info(`Tabulator Info - ${msg}`, ...args)
    }
  }
}
