export default class ComponentFunctionBinder {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    this.table = table

    this.bindings = {}
  }

  /**
   * Bind a component function handler.
   * @param {string} type Component type key.
   * @param {string} funcName Function name to bind.
   * @param {Function} handler Handler function.
   */
  bind(type, funcName, handler) {
    if (!this.bindings[type]) {
      this.bindings[type] = {}
    }

    if (Object.prototype.hasOwnProperty.call(this.bindings[type], funcName)) {
      console.warn(
        'Unable to bind component handler, a matching function name is already bound',
        type,
        funcName,
        handler
      )
    } else {
      this.bindings[type][funcName] = handler
    }
  }

  /**
   * Resolve a bound handler for a component function lookup.
   * @param {string} type Component type key.
   * @param {object} component Component instance.
   * @param {string|symbol} name Function/property name.
   * @returns {Function|undefined}
   */
  handle(type, component, name) {
    const bindings = this.bindings[type]

    if (
      bindings &&
      Object.prototype.hasOwnProperty.call(bindings, name) &&
      typeof bindings[name]?.bind === 'function'
    ) {
      return bindings[name].bind(null, component)
    } else {
      if (name !== 'then' && typeof name === 'string' && !name.startsWith('_')) {
        if (this.table.options.debugInvalidComponentFuncs) {
          console.error(
            'The ' +
              type +
              ' component does not have a ' +
              name +
              ' function, have you checked that you have the correct Tabulator module installed?'
          )
        }
      }
    }
  }
}
