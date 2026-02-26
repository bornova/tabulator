import Module from '../../core/Module.js'

import Cell from '../../core/cell/Cell.js'
import Column from '../../core/column/Column.js'

export default class Interaction extends Module {
  static moduleName = 'interaction'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.eventMap = {
      // row events
      rowClick: 'row-click',
      rowDblClick: 'row-dblclick',
      rowContext: 'row-contextmenu',
      rowMouseEnter: 'row-mouseenter',
      rowMouseLeave: 'row-mouseleave',
      rowMouseOver: 'row-mouseover',
      rowMouseOut: 'row-mouseout',
      rowMouseMove: 'row-mousemove',
      rowMouseDown: 'row-mousedown',
      rowMouseUp: 'row-mouseup',
      rowTap: 'row',
      rowDblTap: 'row',
      rowTapHold: 'row',

      // cell events
      cellClick: 'cell-click',
      cellDblClick: 'cell-dblclick',
      cellContext: 'cell-contextmenu',
      cellMouseEnter: 'cell-mouseenter',
      cellMouseLeave: 'cell-mouseleave',
      cellMouseOver: 'cell-mouseover',
      cellMouseOut: 'cell-mouseout',
      cellMouseMove: 'cell-mousemove',
      cellMouseDown: 'cell-mousedown',
      cellMouseUp: 'cell-mouseup',
      cellTap: 'cell',
      cellDblTap: 'cell',
      cellTapHold: 'cell',

      // column header events
      headerClick: 'column-click',
      headerDblClick: 'column-dblclick',
      headerContext: 'column-contextmenu',
      headerMouseEnter: 'column-mouseenter',
      headerMouseLeave: 'column-mouseleave',
      headerMouseOver: 'column-mouseover',
      headerMouseOut: 'column-mouseout',
      headerMouseMove: 'column-mousemove',
      headerMouseDown: 'column-mousedown',
      headerMouseUp: 'column-mouseup',
      headerTap: 'column',
      headerDblTap: 'column',
      headerTapHold: 'column',

      // group header
      groupClick: 'group-click',
      groupDblClick: 'group-dblclick',
      groupContext: 'group-contextmenu',
      groupMouseEnter: 'group-mouseenter',
      groupMouseLeave: 'group-mouseleave',
      groupMouseOver: 'group-mouseover',
      groupMouseOut: 'group-mouseout',
      groupMouseMove: 'group-mousemove',
      groupMouseDown: 'group-mousedown',
      groupMouseUp: 'group-mouseup',
      groupTap: 'group',
      groupDblTap: 'group',
      groupTapHold: 'group'
    }

    this.subscribers = {}

    this.touchSubscribers = {}

    this.columnSubscribers = {}

    this.touchWatchers = {
      row: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      cell: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      column: {
        tap: null,
        tapDbl: null,
        tapHold: null
      },
      group: {
        tap: null,
        tapDbl: null,
        tapHold: null
      }
    }

    this.registerColumnOption('headerClick')
    this.registerColumnOption('headerDblClick')
    this.registerColumnOption('headerContext')
    this.registerColumnOption('headerMouseEnter')
    this.registerColumnOption('headerMouseLeave')
    this.registerColumnOption('headerMouseOver')
    this.registerColumnOption('headerMouseOut')
    this.registerColumnOption('headerMouseMove')
    this.registerColumnOption('headerMouseDown')
    this.registerColumnOption('headerMouseUp')
    this.registerColumnOption('headerTap')
    this.registerColumnOption('headerDblTap')
    this.registerColumnOption('headerTapHold')

    this.registerColumnOption('cellClick')
    this.registerColumnOption('cellDblClick')
    this.registerColumnOption('cellContext')
    this.registerColumnOption('cellMouseEnter')
    this.registerColumnOption('cellMouseLeave')
    this.registerColumnOption('cellMouseOver')
    this.registerColumnOption('cellMouseOut')
    this.registerColumnOption('cellMouseMove')
    this.registerColumnOption('cellMouseDown')
    this.registerColumnOption('cellMouseUp')
    this.registerColumnOption('cellTap')
    this.registerColumnOption('cellDblTap')
    this.registerColumnOption('cellTapHold')
  }

  /**
   * Initialize interaction subscriptions.
   */
  initialize() {
    this.initializeExternalEvents()

    this.subscribe('column-init', this.initializeColumn.bind(this))
    this.subscribe('cell-dblclick', this.cellContentsSelectionFixer.bind(this))
    this.subscribe('scroll-horizontal', this.clearTouchWatchers.bind(this))
    this.subscribe('scroll-vertical', this.clearTouchWatchers.bind(this))
  }

  /**
   * Reset touch watcher state for all component types.
   */
  clearTouchWatchers() {
    Object.values(this.touchWatchers).forEach((watchers) => {
      clearTimeout(watchers.tapDbl)
      clearTimeout(watchers.tapHold)

      Object.keys(watchers).forEach((key) => {
        watchers[key] = null
      })
    })
  }

  /**
   * Prevent accidental editor text selection on double click.
   * @param {Event} e DOM event.
   * @param {object} cell Internal cell.
   */
  cellContentsSelectionFixer(e, cell) {
    let range

    if (this.table.modExists('edit')) {
      if (this.table.modules.edit.currentCell === cell) {
        return // prevent instant selection of editor content
      }
    }

    e.preventDefault()

    try {
      if (window.getSelection) {
        range = document.createRange()
        range.selectNode(cell.getElement())
        window.getSelection().removeAllRanges()
        window.getSelection().addRange(range)
      }
    } catch {
      return
    }
  }

  /**
   * Register external subscription change handlers for interaction events.
   */
  initializeExternalEvents() {
    Object.keys(this.eventMap).forEach((key) => {
      this.subscriptionChangeExternal(key, this.subscriptionChanged.bind(this, key))
    })
  }

  /**
   * Handle external subscription lifecycle for interaction events.
   * @param {string} key External event key.
   * @param {boolean} added Whether a subscriber was added.
   */
  subscriptionChanged(key, added) {
    const eventName = this.eventMap[key]
    const isTouchEvent = !eventName.includes('-')

    if (added) {
      if (this.subscribers[key]) {
        return
      }

      if (!isTouchEvent) {
        this.subscribers[key] = this.handle.bind(this, key)
        this.subscribe(eventName, this.subscribers[key])
      } else {
        this.subscribeTouchEvents(key)
      }
    } else {
      if (!isTouchEvent) {
        if (this.subscribers[key] && !this.columnSubscribers[key] && !this.subscribedExternal(key)) {
          this.unsubscribe(eventName, this.subscribers[key])
          delete this.subscribers[key]
        }
      } else {
        this.unsubscribeTouchEvents(key)
      }
    }
  }

  /**
   * Subscribe internal touchstart/touchend handlers for a touch event group.
   * @param {string} key External event key.
   */
  subscribeTouchEvents(key) {
    const type = this.eventMap[key]
    const startEvent = `${type}-touchstart`
    const endEvent = `${type}-touchend`

    if (!this.touchSubscribers[startEvent]) {
      this.touchSubscribers[startEvent] = this.handleTouch.bind(this, type, 'start')
      this.touchSubscribers[endEvent] = this.handleTouch.bind(this, type, 'end')

      this.subscribe(startEvent, this.touchSubscribers[startEvent])
      this.subscribe(endEvent, this.touchSubscribers[endEvent])
    }

    this.subscribers[key] = true
  }

  /**
   * Unsubscribe touch handlers when no listeners remain.
   * @param {string} key External event key.
   */
  unsubscribeTouchEvents(key) {
    let noTouch = true
    const type = this.eventMap[key]
    const startEvent = `${type}-touchstart`
    const endEvent = `${type}-touchend`

    if (this.subscribers[key] && !this.subscribedExternal(key)) {
      delete this.subscribers[key]

      for (const eventKey in this.eventMap) {
        if (this.eventMap[eventKey] === type && this.subscribers[eventKey]) {
          noTouch = false
          break
        }
      }

      if (noTouch) {
        this.unsubscribe(startEvent, this.touchSubscribers[startEvent])
        this.unsubscribe(endEvent, this.touchSubscribers[endEvent])

        delete this.touchSubscribers[startEvent]
        delete this.touchSubscribers[endEvent]
      }
    }
  }

  /**
   * Register column-level interaction callbacks.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    const def = column.definition

    for (const key in this.eventMap) {
      if (def[key]) {
        this.subscriptionChanged(key, true)

        if (!this.columnSubscribers[key]) {
          this.columnSubscribers[key] = []
        }

        this.columnSubscribers[key].push(column)
      }
    }
  }

  /**
   * Dispatch non-touch interaction events.
   * @param {string} action Event action key.
   * @param {Event} e DOM event.
   * @param {object} component Internal component.
   */
  handle(action, e, component) {
    this.dispatchEvent(action, e, component)
  }

  /**
   * Track touch gesture state and emit tap/double-tap/hold events.
   * @param {'row'|'cell'|'column'|'group'} type Component type.
   * @param {'start'|'end'} action Touch phase.
   * @param {Event} e DOM event.
   * @param {object} component Internal component.
   */
  handleTouch(type, action, e, component) {
    const watchers = this.touchWatchers[type]
    const dispatchType = type === 'column' ? 'header' : type

    switch (action) {
      case 'start':
        watchers.tap = true

        clearTimeout(watchers.tapHold)

        watchers.tapHold = setTimeout(() => {
          clearTimeout(watchers.tapHold)
          watchers.tapHold = null

          watchers.tap = null
          clearTimeout(watchers.tapDbl)
          watchers.tapDbl = null

          this.dispatchEvent(`${dispatchType}TapHold`, e, component)
        }, 1000)
        break

      case 'end':
        if (watchers.tap) {
          watchers.tap = null
          this.dispatchEvent(`${dispatchType}Tap`, e, component)
        }

        if (watchers.tapDbl) {
          clearTimeout(watchers.tapDbl)
          watchers.tapDbl = null

          this.dispatchEvent(`${dispatchType}DblTap`, e, component)
        } else {
          watchers.tapDbl = setTimeout(() => {
            clearTimeout(watchers.tapDbl)
            watchers.tapDbl = null
          }, 300)
        }

        clearTimeout(watchers.tapHold)
        watchers.tapHold = null
        break
    }
  }

  /**
   * Execute column callback and dispatch external interaction event.
   * @param {string} action Event action key.
   * @param {Event} e DOM event.
   * @param {object} component Internal component.
   */
  dispatchEvent(action, e, component) {
    const componentObj = component.getComponent()

    let callback

    if (this.columnSubscribers[action]) {
      if (component instanceof Cell) {
        callback = component.column.definition[action]
      } else if (component instanceof Column) {
        callback = component.definition[action]
      }

      if (callback) {
        callback(e, componentObj)
      }
    }

    this.dispatchExternal(action, e, componentObj)
  }
}
