import Module from '../../core/Module.js'

export default class Comms extends Module {
  static moduleName = 'comms'

  /**
   * Initialize inter-table communication API.
   */
  initialize() {
    this.registerTableFunction('tableComms', this.receive.bind(this))
  }

  /**
   * Resolve table connections from selectors.
   * @param {*} selectors Selector(s) used by table registry.
   * @returns {Array<object>}
   */
  getConnections(selectors) {
    return this.table.constructor.registry.lookupTable(selectors).filter((connection) => this.table !== connection)
  }

  /**
   * Send message to connected tables.
   * @param {*} selectors Selector(s) for target tables.
   * @param {string} module Target module name.
   * @param {string} action Target action name.
   * @param {*} data Message payload.
   */
  send(selectors, module, action, data) {
    const connections = this.getConnections(selectors)

    connections.forEach((connection) => {
      connection.tableComms(this.table.element, module, action, data)
    })

    if (!connections.length && selectors) {
      console.warn('Table Connection Error - No tables matching selector found', selectors)
    }
  }

  /**
   * Receive and route inter-table message to target module.
   * @param {HTMLElement} table Source table element.
   * @param {string} module Target module name.
   * @param {string} action Target action name.
   * @param {*} data Message payload.
   * @returns {*}
   */
  receive(table, module, action, data) {
    if (this.table.modExists(module)) {
      return this.table.modules[module].commsReceived(table, action, data)
    }

    console.warn('Inter-table Comms Error - no such module:', module)

    return false
  }
}
