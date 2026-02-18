export default class CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    this.table = table
  }

  /// ///////////////////////////////////////
  /// //////////// DataLoad /////////////////
  /// ///////////////////////////////////////

  /**
   * Reload table data through data loader.
   * @param {*} data Data source.
   * @param {boolean} silent Silent mode.
   * @param {boolean} columnsChanged Columns changed flag.
   * @returns {Promise<*>}
   */
  reloadData(data, silent, columnsChanged) {
    return this.table.dataLoader.load(data, undefined, undefined, undefined, silent, columnsChanged)
  }

  /// ///////////////////////////////////////
  /// ////////// Localization ///////////////
  /// ///////////////////////////////////////

  /**
   * Get localized text.
   * @param {...*} args Localization args.
   * @returns {string}
   */
  langText(...args) {
    return this.table.modules.localize.getText(...args)
  }

  /**
   * Bind localized text updates.
   * @param {...*} args Binding args.
   * @returns {void}
   */
  langBind(...args) {
    return this.table.modules.localize.bind(...args)
  }

  /**
   * Get active locale.
   * @param {...*} args Locale args.
   * @returns {string}
   */
  langLocale(...args) {
    return this.table.modules.localize.getLocale(...args)
  }

  /// ///////////////////////////////////////
  /// /////// Inter Table Comms /////////////
  /// ///////////////////////////////////////

  /**
   * Resolve inter-table connections.
   * @param {...*} args Connection selectors.
   * @returns {Array<object>}
   */
  commsConnections(...args) {
    return this.table.modules.comms.getConnections(...args)
  }

  /**
   * Send inter-table message.
   * @param {...*} args Message args.
   * @returns {void}
   */
  commsSend(...args) {
    return this.table.modules.comms.send(...args)
  }

  /// ///////////////////////////////////////
  /// ///////////// Layout  /////////////////
  /// ///////////////////////////////////////

  /**
   * Get active layout mode.
   * @returns {string}
   */
  layoutMode() {
    return this.table.modules.layout.getMode()
  }

  /**
   * Trigger layout refresh.
   * @param {boolean} force Force layout.
   * @returns {void}
   */
  layoutRefresh(force) {
    return this.table.modules.layout.layout(force)
  }

  /// ///////////////////////////////////////
  /// //////////// Event Bus ////////////////
  /// ///////////////////////////////////////

  /**
   * Subscribe to internal event bus.
   * @param {...*} args Subscription args.
   * @returns {*}
   */
  subscribe(...args) {
    return this.table.eventBus.subscribe(...args)
  }

  /**
   * Unsubscribe from internal event bus.
   * @param {...*} args Unsubscribe args.
   * @returns {*}
   */
  unsubscribe(...args) {
    return this.table.eventBus.unsubscribe(...args)
  }

  subscribed(key) {
    return this.table.eventBus.subscribed(key)
  }

  subscriptionChange(...args) {
    return this.table.eventBus.subscriptionChange(...args)
  }

  dispatch(...args) {
    return this.table.eventBus.dispatch(...args)
  }

  chain(...args) {
    return this.table.eventBus.chain(...args)
  }

  confirm(...args) {
    return this.table.eventBus.confirm(...args)
  }

  dispatchExternal(...args) {
    return this.table.externalEvents.dispatch(...args)
  }

  subscribedExternal(key) {
    return this.table.externalEvents.subscribed(key)
  }

  subscriptionChangeExternal(...args) {
    return this.table.externalEvents.subscriptionChange(...args)
  }

  /// ///////////////////////////////////////
  /// ///////////// Options /////////////////
  /// ///////////////////////////////////////

  /**
   * Read option value.
   * @param {string} key Option key.
   * @returns {*}
   */
  options(key) {
    return this.table.options[key]
  }

  /**
   * Set/read option value.
   * @param {string} key Option key.
   * @param {*} value Option value.
   * @returns {*}
   */
  setOption(key, value) {
    if (value !== undefined) {
      this.table.options[key] = value
    }

    return this.table.options[key]
  }

  /// ///////////////////////////////////////
  /// //////// Deprecation Checks ///////////
  /// ///////////////////////////////////////

  deprecationCheck(oldOption, newOption, convert) {
    return this.table.deprecationAdvisor.check(oldOption, newOption, convert)
  }

  deprecationCheckMsg(oldOption, msg) {
    return this.table.deprecationAdvisor.checkMsg(oldOption, msg)
  }

  deprecationMsg(msg) {
    return this.table.deprecationAdvisor.msg(msg)
  }
  /// ///////////////////////////////////////
  /// ///////////// Modules /////////////////
  /// ///////////////////////////////////////

  /**
   * Resolve module by key.
   * @param {string} key Module key.
   * @returns {*}
   */
  module(key) {
    return this.table.module(key)
  }
}
