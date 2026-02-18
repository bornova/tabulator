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
   * @returns {void}
   */
  bind(type, funcName, handler) {
    if (!this.bindings[type]) {
      this.bindings[type] = {}
    }

    if (this.bindings[type][funcName]) {
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
    if (this.bindings[type] && this.bindings[type][name] && typeof this.bindings[type][name].bind === 'function') {
      return this.bindings[type][name].bind(null, component)
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
