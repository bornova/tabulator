import CoreFeature from '../CoreFeature.js'
import Row from '../row/Row.js'

export default class InteractionManager extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.el = null

    this.abortClasses = ['tabulator-headers', 'tabulator-table']

    this.previousTargets = {}

    this.listeners = [
      'click',
      'dblclick',
      'contextmenu',
      'mouseenter',
      'mouseleave',
      'mouseover',
      'mouseout',
      'mousemove',
      'mouseup',
      'mousedown',
      'touchstart',
      'touchend'
    ]

    this.componentMap = {
      'tabulator-cell': 'cell',
      'tabulator-row': 'row',
      'tabulator-group': 'group',
      'tabulator-col': 'column'
    }

    this.pseudoTrackers = {
      row: {
        subscriber: null,
        target: null
      },
      cell: {
        subscriber: null,
        target: null
      },
      group: {
        subscriber: null,
        target: null
      },
      column: {
        subscriber: null,
        target: null
      }
    }

    this.pseudoTracking = false
  }

  /**
   * Initialize interaction monitoring and subscriptions.
   * @returns {void}
   */
  initialize() {
    this.el = this.table.element

    this.buildListenerMap()
    this.bindSubscriptionWatchers()
  }

  /**
   * Build listener metadata map from listener names.
   * @returns {void}
   */
  buildListenerMap() {
    const listenerMap = {}

    this.listeners.forEach((listener) => {
      listenerMap[listener] = {
        handler: null,
        components: []
      }
    })

    this.listeners = listenerMap
  }

  /**
   * Bind pseudo enter/leave trackers using mouseover events.
   * @returns {void}
   */
  bindPseudoEvents() {
    Object.keys(this.pseudoTrackers).forEach((key) => {
      this.pseudoTrackers[key].subscriber = this.pseudoMouseEnter.bind(this, key)
      this.subscribe(key + '-mouseover', this.pseudoTrackers[key].subscriber)
    })

    this.pseudoTracking = true
  }

  /**
   * Handle pseudo mouse enter transitions.
   * @param {string} key Component key.
   * @param {Event} e Source event.
   * @param {object} target Target component.
   * @returns {void}
   */
  pseudoMouseEnter(key, e, target) {
    if (this.pseudoTrackers[key].target !== target) {
      if (this.pseudoTrackers[key].target) {
        this.dispatch(key + '-mouseleave', e, this.pseudoTrackers[key].target)
      }

      this.pseudoMouseLeave(key, e)

      this.pseudoTrackers[key].target = target

      this.dispatch(key + '-mouseenter', e, target)
    }
  }

  /**
   * Handle pseudo mouse leave transitions for tracked components.
   * @param {string} key Component key.
   * @param {Event} e Source event.
   * @returns {void}
   */
  pseudoMouseLeave(key, e) {
    let leaveList = Object.keys(this.pseudoTrackers)
    const linkedKeys = {
      row: ['cell'],
      cell: ['row']
    }

    leaveList = leaveList.filter((item) => {
      const links = linkedKeys[key]
      return item !== key && (!links || (links && !links.includes(item)))
    })

    leaveList.forEach((key) => {
      const target = this.pseudoTrackers[key].target

      if (this.pseudoTrackers[key].target) {
        this.dispatch(key + '-mouseleave', e, target)

        this.pseudoTrackers[key].target = null
      }
    })
  }

  /**
   * Bind subscription change watchers for all component/listener combinations.
   * @returns {void}
   */
  bindSubscriptionWatchers() {
    const listeners = Object.keys(this.listeners)
    const components = Object.values(this.componentMap)

    for (const comp of components) {
      for (const listener of listeners) {
        const key = comp + '-' + listener

        this.subscriptionChange(key, this.subscriptionChanged.bind(this, comp, listener))
      }
    }

    this.subscribe('table-destroy', this.clearWatchers.bind(this))
  }

  /**
   * Handle subscription state changes for a component/listener pair.
   * @param {string} component Component key.
   * @param {string} key Listener key.
   * @param {boolean} added Subscription added state.
   * @returns {void}
   */
  subscriptionChanged(component, key, added) {
    const listener = this.listeners[key].components
    const index = listener.indexOf(component)
    let changed = false

    if (added) {
      if (index === -1) {
        listener.push(component)
        changed = true
      }
    } else {
      if (!this.subscribed(component + '-' + key)) {
        if (index > -1) {
          listener.splice(index, 1)
          changed = true
        }
      }
    }

    if ((key === 'mouseenter' || key === 'mouseleave') && !this.pseudoTracking) {
      this.bindPseudoEvents()
    }

    if (changed) {
      this.updateEventListeners()
    }
  }

  /**
   * Attach or remove DOM listeners based on current subscriptions.
   * @returns {void}
   */
  updateEventListeners() {
    for (const key in this.listeners) {
      const listener = this.listeners[key]

      if (listener.components.length) {
        if (!listener.handler) {
          listener.handler = this.track.bind(this, key)
          this.el.addEventListener(key, listener.handler)
          // this.el.addEventListener(key, listener.handler, {passive: true})
        }
      } else {
        if (listener.handler) {
          this.el.removeEventListener(key, listener.handler)
          listener.handler = null
        }
      }
    }
  }

  /**
   * Track a DOM event and dispatch component-level events.
   * @param {string} type Event type.
   * @param {Event} e Source event.
   * @returns {void}
   */
  track(type, e) {
    const path = (e.composedPath && e.composedPath()) || e.path || []

    let targets = this.findTargets(path)
    targets = this.bindComponents(type, targets)

    this.triggerEvents(type, e, targets)

    if (this.pseudoTracking && (type === 'mouseover' || type === 'mouseleave') && !Object.keys(targets).length) {
      this.pseudoMouseLeave('none', e)
    }
  }

  /**
   * Find potential component targets from an event path.
   * @param {Array<EventTarget>} path Event composed path.
   * @returns {object}
   */
  findTargets(path) {
    const targets = {}

    const componentMap = Object.keys(this.componentMap)

    for (const el of path) {
      const classList = el.classList ? [...el.classList] : []

      const abort = classList.filter((item) => this.abortClasses.includes(item))

      if (abort.length) {
        break
      }

      const elTargets = classList.filter((item) => componentMap.includes(item))

      for (const target of elTargets) {
        if (!targets[this.componentMap[target]]) {
          targets[this.componentMap[target]] = el
        }
      }
    }

    if (targets.group && targets.group === targets.row) {
      delete targets.row
    }

    return targets
  }

  /**
   * Resolve internal component objects from target elements.
   * @param {string} type Event type.
   * @param {object} targets Target element map.
   * @returns {object}
   */
  bindComponents(type, targets) {
    // ensure row component is looked up before cell
    const keys = Object.keys(targets).reverse()
    const listener = this.listeners[type]
    const matches = {}
    const output = {}
    const targetMatches = {}

    for (const key of keys) {
      let component
      const target = targets[key]
      const previousTarget = this.previousTargets[key]

      if (previousTarget && previousTarget.target === target) {
        component = previousTarget.component
      } else {
        switch (key) {
          case 'row':
          case 'group':
            if (
              listener.components.includes('row') ||
              listener.components.includes('cell') ||
              listener.components.includes('group')
            ) {
              const rows = this.table.rowManager.getVisibleRows(true)

              component = rows.find((row) => row.getElement() === target)

              if (targets.row && targets.row.parentNode && targets.row.parentNode.closest('.tabulator-row')) {
                targets[key] = false
              }
            }
            break

          case 'column':
            if (listener.components.includes('column')) {
              component = this.table.columnManager.findColumn(target)
            }
            break

          case 'cell':
            if (listener.components.includes('cell')) {
              if (matches.row instanceof Row) {
                component = matches.row.findCell(target)
              } else {
                if (targets.row) {
                  console.warn(
                    'Event Target Lookup Error - The row this cell is attached to cannot be found, has the table been reinitialized without being destroyed first?'
                  )
                }
              }
            }
            break
        }
      }

      if (component) {
        matches[key] = component
        targetMatches[key] = {
          target,
          component
        }
      }
    }

    this.previousTargets = targetMatches

    // reverse order keys are set in so events trigger in correct sequence
    Object.keys(targets).forEach((key) => {
      const value = matches[key]
      output[key] = value
    })

    return output
  }

  /**
   * Trigger component event bus dispatches for resolved targets.
   * @param {string} type Event type.
   * @param {Event} e Source event.
   * @param {object} targets Resolved component targets.
   * @returns {void}
   */
  triggerEvents(type, e, targets) {
    const listener = this.listeners[type]

    for (const key in targets) {
      if (targets[key] && listener.components.includes(key)) {
        this.dispatch(key + '-' + type, e, targets[key])
      }
    }
  }

  /**
   * Remove all active DOM event watchers.
   * @returns {void}
   */
  clearWatchers() {
    for (const key in this.listeners) {
      const listener = this.listeners[key]

      if (listener.handler) {
        this.el.removeEventListener(key, listener.handler)
        listener.handler = null
      }
    }
  }
}
