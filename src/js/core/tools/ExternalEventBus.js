export default class ExternalEventBus {
  /**
   * @param {object} table Tabulator table instance.
   * @param {object} [optionsList] Optional event options map.
   * @param {boolean|Array<string>} [debug] Debug mode or debug event list.
   */
  constructor(table, optionsList, debug) {
    this.table = table
    this.events = {}
    this.optionsList = optionsList || {}
    this.subscriptionNotifiers = {}

    this.dispatch = debug ? this._debugDispatch.bind(this) : this._dispatch.bind(this)
    this.debug = debug
  }

  /**
   * Register a callback notified when subscription state changes for an event.
   * @param {string} key Event key.
   * @param {Function} callback Subscription change callback.
   */
  subscriptionChange(key, callback) {
    if (!this.subscriptionNotifiers[key]) {
      this.subscriptionNotifiers[key] = []
    }

    this.subscriptionNotifiers[key].push(callback)

    if (this.subscribed(key)) {
      this._notifySubscriptionChange(key, true)
    }
  }

  /**
   * Subscribe to an external event.
   * @param {string} key Event key.
   * @param {Function} callback Event callback.
   */
  subscribe(key, callback) {
    if (!this.events[key]) {
      this.events[key] = []
    }

    this.events[key].push(callback)

    this._notifySubscriptionChange(key, true)
  }

  /**
   * Unsubscribe from an external event.
   * @param {string} key Event key.
   * @param {Function} [callback] Specific callback to remove; omit to remove all.
   */
  unsubscribe(key, callback) {
    let index

    if (this.events[key]) {
      if (callback) {
        index = this.events[key].findIndex((item) => item === callback)

        if (index > -1) {
          this.events[key].splice(index, 1)
        } else {
          console.warn('Cannot remove event, no matching event found:', key, callback)
          return
        }
      } else {
        delete this.events[key]
      }
    } else {
      console.warn('Cannot remove event, no events set on:', key)
      return
    }

    this._notifySubscriptionChange(key, false)
  }

  /**
   * Check if an event has subscribers.
   * @param {string} key Event key.
   * @returns {number|boolean}
   */
  subscribed(key) {
    return this.events[key] && this.events[key].length
  }

  /**
   * Notify subscription state change listeners.
   * @param {string} key Event key.
   * @param {boolean} subscribed Current subscription state.
   */
  _notifySubscriptionChange(key, subscribed) {
    const notifiers = this.subscriptionNotifiers[key]

    if (notifiers) {
      notifiers.forEach((callback) => {
        callback(subscribed)
      })
    }
  }

  /**
   * Dispatch an external event.
   * @param {...*} args Event key followed by callback arguments.
   * @returns {*}
   */
  _dispatch(...args) {
    const key = args.shift()
    let result

    if (this.events[key]) {
      this.events[key].forEach((callback, i) => {
        const callResult = callback.apply(this.table, args)

        if (!i) {
          result = callResult
        }
      })
    }

    return result
  }

  /**
   * Dispatch with optional debug logging.
   * @param {...*} args Event key followed by callback arguments.
   * @returns {*}
   */
  _debugDispatch(...args) {
    const key = args[0]

    args[0] = 'ExternalEvent:' + args[0]

    if (this.debug === true || (Array.isArray(this.debug) && this.debug.includes(key))) {
      console.log(...args)
    }

    return this._dispatch(...args)
  }
}
