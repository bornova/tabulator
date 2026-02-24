export default class OptionsList {
  /**
   * @param {object} table Tabulator table instance.
   * @param {string} msgType Option group label used in warnings.
   * @param {object} [defaults={}] Registered default option overrides.
   */
  constructor(table, msgType, defaults = {}) {
    this.table = table
    this.msgType = msgType
    this.registeredDefaults = { ...defaults }
  }

  /**
   * Register a default option value.
   * @param {string} option Option key.
   * @param {*} value Default value.
   * @returns {void}
   */
  register(option, value) {
    this.registeredDefaults[option] = value
  }

  /**
   * Generate final option object from defaults and user options.
   * @param {object} defaultOptions Option defaults.
   * @param {object} [userOptions={}] User-provided options.
   * @returns {object}
   */
  generate(defaultOptions, userOptions = {}) {
    const output = { ...this.registeredDefaults }
    const warn = this.table.options.debugInvalidOptions || userOptions.debugInvalidOptions === true

    Object.assign(output, defaultOptions)

    for (const key in userOptions) {
      if (!Object.prototype.hasOwnProperty.call(output, key)) {
        if (warn) {
          console.warn('Invalid ' + this.msgType + ' option:', key)
        }

        output[key] = userOptions[key]
      }
    }

    for (const key in output) {
      if (key in userOptions) {
        output[key] = userOptions[key]
      } else {
        if (Array.isArray(output[key])) {
          output[key] = [...output[key]]
        } else if (typeof output[key] === 'object' && output[key] !== null) {
          output[key] = { ...output[key] }
        } else if (output[key] === undefined) {
          delete output[key]
        }
      }
    }

    return output
  }
}
