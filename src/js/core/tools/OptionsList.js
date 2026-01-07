export default class OptionsList {
  constructor(table, msgType, defaults = {}) {
    this.table = table
    this.msgType = msgType
    this.registeredDefaults = Object.assign({}, defaults)
  }

  register(option, value) {
    this.registeredDefaults[option] = value
  }

  generate(defaultOptions, userOptions = {}) {
    const output = Object.assign({}, this.registeredDefaults)
    const warn = this.table.options.debugInvalidOptions || userOptions.debugInvalidOptions === true

    Object.assign(output, defaultOptions)

    for (const key in userOptions) {
      if (!output.hasOwnProperty(key)) {
        if (warn) {
          console.warn('Invalid ' + this.msgType + ' option:', key)
        }

        output[key] = userOptions.key
      }
    }

    for (const key in output) {
      if (key in userOptions) {
        output[key] = userOptions[key]
      } else {
        if (Array.isArray(output[key])) {
          output[key] = Object.assign([], output[key])
        } else if (typeof output[key] === 'object' && output[key] !== null) {
          output[key] = Object.assign({}, output[key])
        } else if (typeof output[key] === 'undefined') {
          delete output[key]
        }
      }
    }

    return output
  }
}
