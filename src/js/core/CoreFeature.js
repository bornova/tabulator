export default class CoreFeature {
  constructor(table) {
    this.table = table
  }

  /// ///////////////////////////////////////
  /// //////////// DataLoad /////////////////
  /// ///////////////////////////////////////

  reloadData(data, silent, columnsChanged) {
    return this.table.dataLoader.load(data, undefined, undefined, undefined, silent, columnsChanged)
  }

  /// ///////////////////////////////////////
  /// ////////// Localization ///////////////
  /// ///////////////////////////////////////

  langText(...args) {
    return this.table.modules.localize.getText(...args)
  }

  langBind(...args) {
    return this.table.modules.localize.bind(...args)
  }

  langLocale(...args) {
    return this.table.modules.localize.getLocale(...args)
  }

  /// ///////////////////////////////////////
  /// /////// Inter Table Comms /////////////
  /// ///////////////////////////////////////

  commsConnections(...args) {
    return this.table.modules.comms.getConnections(...args)
  }

  commsSend(...args) {
    return this.table.modules.comms.send(...args)
  }

  /// ///////////////////////////////////////
  /// ///////////// Layout  /////////////////
  /// ///////////////////////////////////////

  layoutMode() {
    return this.table.modules.layout.getMode()
  }

  layoutRefresh(force) {
    return this.table.modules.layout.layout(force)
  }

  /// ///////////////////////////////////////
  /// //////////// Event Bus ////////////////
  /// ///////////////////////////////////////

  subscribe(...args) {
    return this.table.eventBus.subscribe(...args)
  }

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

  options(key) {
    return this.table.options[key]
  }

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

  module(key) {
    return this.table.module(key)
  }
}
