export default class InternalEventBus {
  /**
   * @param {boolean|Array<string>} [debug] Debug mode or debug event list.
   */
  constructor(debug) {
    this.events = {}
    this.subscriptionNotifiers = {}

    this.dispatch = debug ? this._debugDispatch.bind(this) : this._dispatch.bind(this)
    this.chain = debug ? this._debugChain.bind(this) : this._chain.bind(this)
    this.confirm = debug ? this._debugConfirm.bind(this) : this._confirm.bind(this)
    this.debug = debug
  }

  /**
   * Register a subscription-state notifier for an event key.
   * @param {string} key Event key.
   * @param {Function} callback Notifier callback.
   * @returns {void}
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
   * Subscribe to an internal event.
   * @param {string} key Event key.
   * @param {Function} callback Subscriber callback.
   * @param {number} [priority=10000] Subscriber priority (lower runs first).
   * @returns {void}
   */
  subscribe(key, callback, priority = 10000) {
    if (!this.events[key]) {
      this.events[key] = []
    }

    this.events[key].push({ callback, priority })

    this.events[key].sort((a, b) => {
      return a.priority - b.priority
    })

    this._notifySubscriptionChange(key, true)
  }

  /**
   * Unsubscribe from an internal event.
   * @param {string} key Event key.
   * @param {Function} callback Subscriber callback.
   * @returns {void}
   */
  unsubscribe(key, callback) {
    let index

    if (this.events[key]) {
      if (callback) {
        index = this.events[key].findIndex((item) => {
          return item.callback === callback
        })

        if (index > -1) {
          this.events[key].splice(index, 1)
        } else {
          console.warn('Cannot remove event, no matching event found:', key, callback)
          return
        }
      }
    } else {
      console.warn('Cannot remove event, no events set on:', key)
      return
    }

    this._notifySubscriptionChange(key, false)
  }

  /**
   * Check whether an event key has active subscribers.
   * @param {string} key Event key.
   * @returns {number|boolean}
   */
  subscribed(key) {
    return this.events[key] && this.events[key].length
  }

  /**
   * Run a chained event pipeline, passing previous value to each subscriber.
   * @param {string} key Event key.
   * @param {Array|*} args Subscriber arguments.
   * @param {*} initialValue Initial chain value.
   * @param {Function|*} fallback Fallback value/function when unsubscribed.
   * @returns {*}
   */
  _chain(key, args, initialValue, fallback) {
    let value = initialValue

    if (!Array.isArray(args)) {
      args = [args]
    }

    if (this.subscribed(key)) {
      this.events[key].forEach((subscriber, i) => {
        value = subscriber.callback.apply(this, args.concat([value]))
      })

      return value
    } else {
      return typeof fallback === 'function' ? fallback() : fallback
    }
  }

  /**
   * Check whether any subscriber confirms a condition.
   * @param {string} key Event key.
   * @param {Array|*} args Subscriber arguments.
   * @returns {boolean}
   */
  _confirm(key, args) {
    let confirmed = false

    if (!Array.isArray(args)) {
      args = [args]
    }

    if (this.subscribed(key)) {
      this.events[key].forEach((subscriber, i) => {
        if (subscriber.callback.apply(this, args)) {
          confirmed = true
        }
      })
    }

    return confirmed
  }

  /**
   * Notify subscription change listeners for an event key.
   * @param {string} key Event key.
   * @param {boolean} subscribed Current subscription state.
   * @returns {void}
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
   * Dispatch an internal event to all subscribers.
   * @returns {void}
   */
  _dispatch() {
    const args = Array.from(arguments)
    const key = args.shift()

    if (this.events[key]) {
      this.events[key].forEach((subscriber) => {
        subscriber.callback.apply(this, args)
      })
    }
  }

  /**
   * Dispatch with optional debug logging.
   * @returns {void}
   */
  _debugDispatch() {
    const args = Array.from(arguments)
    const key = args[0]

    args[0] = 'InternalEvent:' + key

    if (this.debug === true || this.debug.includes(key)) {
      console.log(...args)
    }

    return this._dispatch(...arguments)
  }

  /**
   * Chain-dispatch with optional debug logging.
   * @returns {*}
   */
  _debugChain() {
    const args = Array.from(arguments)
    const key = args[0]

    args[0] = 'InternalEvent:' + key

    if (this.debug === true || this.debug.includes(key)) {
      console.log(...args)
    }

    return this._chain(...arguments)
  }

  /**
   * Confirm-dispatch with optional debug logging.
   * @returns {boolean}
   */
  _debugConfirm() {
    const args = Array.from(arguments)
    const key = args[0]

    args[0] = 'InternalEvent:' + key

    if (this.debug === true || this.debug.includes(key)) {
      console.log(...args)
    }

    return this._confirm(...arguments)
  }
}
