import Module from '../../core/Module.js'

export default class Popup extends Module {
  static moduleName = 'popup'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.columnSubscribers = {}

    this.registerTableOption('rowContextPopup', false)
    this.registerTableOption('rowClickPopup', false)
    this.registerTableOption('rowDblClickPopup', false)
    this.registerTableOption('groupContextPopup', false)
    this.registerTableOption('groupClickPopup', false)
    this.registerTableOption('groupDblClickPopup', false)

    this.registerColumnOption('headerContextPopup')
    this.registerColumnOption('headerClickPopup')
    this.registerColumnOption('headerDblClickPopup')
    this.registerColumnOption('headerPopup')
    this.registerColumnOption('headerPopupIcon')
    this.registerColumnOption('contextPopup')
    this.registerColumnOption('clickPopup')
    this.registerColumnOption('dblClickPopup')

    this.registerComponentFunction('cell', 'popup', this._componentPopupCall.bind(this))
    this.registerComponentFunction('column', 'popup', this._componentPopupCall.bind(this))
    this.registerComponentFunction('row', 'popup', this._componentPopupCall.bind(this))
    this.registerComponentFunction('group', 'popup', this._componentPopupCall.bind(this))
  }

  /**
   * Initialize popup watchers for rows, groups, and columns.
   */
  initialize() {
    this.initializeRowWatchers()
    this.initializeGroupWatchers()

    this.subscribe('column-init', this.initializeColumn.bind(this))
  }

  /**
   * Invoke popup from component function API.
   * @param {object} component Component instance.
   * @param {*} contents Popup contents.
   * @param {string} [position] Popup position.
   */
  _componentPopupCall(component, contents, position) {
    this.loadPopupEvent(contents, null, component, position)
  }

  /**
   * Initialize row popup watchers.
   */
  initializeRowWatchers() {
    if (this.table.options.rowContextPopup) {
      this.subscribe('row-contextmenu', this.loadPopupEvent.bind(this, this.table.options.rowContextPopup))
      this.table.on('rowTapHold', this.loadPopupEvent.bind(this, this.table.options.rowContextPopup))
    }

    if (this.table.options.rowClickPopup) {
      this.subscribe('row-click', this.loadPopupEvent.bind(this, this.table.options.rowClickPopup))
    }

    if (this.table.options.rowDblClickPopup) {
      this.subscribe('row-dblclick', this.loadPopupEvent.bind(this, this.table.options.rowDblClickPopup))
    }
  }

  /**
   * Initialize group popup watchers.
   */
  initializeGroupWatchers() {
    if (this.table.options.groupContextPopup) {
      this.subscribe('group-contextmenu', this.loadPopupEvent.bind(this, this.table.options.groupContextPopup))
      this.table.on('groupTapHold', this.loadPopupEvent.bind(this, this.table.options.groupContextPopup))
    }

    if (this.table.options.groupClickPopup) {
      this.subscribe('group-click', this.loadPopupEvent.bind(this, this.table.options.groupClickPopup))
    }

    if (this.table.options.groupDblClickPopup) {
      this.subscribe('group-dblclick', this.loadPopupEvent.bind(this, this.table.options.groupDblClickPopup))
    }
  }

  /**
   * Initialize column and cell popup behavior.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    const def = column.definition

    // handle column events
    if (def.headerContextPopup && !this.columnSubscribers.headerContextPopup) {
      this.columnSubscribers.headerContextPopup = this.loadPopupTableColumnEvent.bind(this, 'headerContextPopup')
      this.subscribe('column-contextmenu', this.columnSubscribers.headerContextPopup)
      this.table.on('headerTapHold', this.loadPopupTableColumnEvent.bind(this, 'headerContextPopup'))
    }

    if (def.headerClickPopup && !this.columnSubscribers.headerClickPopup) {
      this.columnSubscribers.headerClickPopup = this.loadPopupTableColumnEvent.bind(this, 'headerClickPopup')
      this.subscribe('column-click', this.columnSubscribers.headerClickPopup)
    }
    if (def.headerDblClickPopup && !this.columnSubscribers.headerDblClickPopup) {
      this.columnSubscribers.headerDblClickPopup = this.loadPopupTableColumnEvent.bind(this, 'headerDblClickPopup')
      this.subscribe('column-dblclick', this.columnSubscribers.headerDblClickPopup)
    }

    if (def.headerPopup) {
      this.initializeColumnHeaderPopup(column)
    }

    // handle cell events
    if (def.contextPopup && !this.columnSubscribers.contextPopup) {
      this.columnSubscribers.contextPopup = this.loadPopupTableCellEvent.bind(this, 'contextPopup')
      this.subscribe('cell-contextmenu', this.columnSubscribers.contextPopup)
      this.table.on('cellTapHold', this.loadPopupTableCellEvent.bind(this, 'contextPopup'))
    }

    if (def.clickPopup && !this.columnSubscribers.clickPopup) {
      this.columnSubscribers.clickPopup = this.loadPopupTableCellEvent.bind(this, 'clickPopup')
      this.subscribe('cell-click', this.columnSubscribers.clickPopup)
    }

    if (def.dblClickPopup && !this.columnSubscribers.dblClickPopup) {
      this.columnSubscribers.dblClickPopup = this.loadPopupTableCellEvent.bind(this, 'dblClickPopup')
      this.subscribe('cell-click', this.columnSubscribers.dblClickPopup)
    }
  }

  /**
   * Initialize header popup button for a column.
   * @param {object} column Internal column.
   */
  initializeColumnHeaderPopup(column) {
    let icon = column.definition.headerPopupIcon
    const headerPopupEl = document.createElement('span')
    headerPopupEl.classList.add('tabulator-header-popup-button')

    if (icon) {
      if (typeof icon === 'function') {
        icon = icon(column.getComponent())
      }

      if (icon instanceof HTMLElement) {
        headerPopupEl.appendChild(icon)
      } else {
        headerPopupEl.innerHTML = icon
      }
    } else {
      headerPopupEl.innerHTML = '&vellip;'
    }

    headerPopupEl.addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()

      this.loadPopupEvent(column.definition.headerPopup, e, column)
    })

    column.titleElement.insertBefore(headerPopupEl, column.titleElement.firstChild)
  }

  /**
   * Handle table cell popup event.
   * @param {string} option Column option key.
   * @param {Event} e Event object.
   * @param {object} cell Cell component/internal cell.
   */
  loadPopupTableCellEvent(option, e, cell) {
    if (cell._cell) {
      cell = cell._cell
    }

    if (cell.column.definition[option]) {
      this.loadPopupEvent(cell.column.definition[option], e, cell)
    }
  }

  /**
   * Handle table column popup event.
   * @param {string} option Column option key.
   * @param {Event} e Event object.
   * @param {object} column Column component/internal column.
   */
  loadPopupTableColumnEvent(option, e, column) {
    if (column._column) {
      column = column._column
    }

    if (column.definition[option]) {
      this.loadPopupEvent(column.definition[option], e, column)
    }
  }

  /**
   * Resolve popup content and dispatch popup loading.
   * @param {*} contents Popup content or resolver.
   * @param {Event} e Event object.
   * @param {object} component Internal component.
   * @param {string} [position] Popup position.
   */
  loadPopupEvent(contents, e, component, position) {
    const onRendered = (callback) => {
      renderedCallback = callback
    }

    let renderedCallback

    if (component._group) {
      component = component._group
    } else if (component._row) {
      component = component._row
    }

    if (!component) {
      return
    }

    const componentRef = component.getComponent()

    contents = typeof contents === 'function' ? contents.call(this.table, e, componentRef, onRendered) : contents

    this.loadPopup(e, component, contents, renderedCallback, position)
  }

  /**
   * Render and show popup UI.
   * @param {Event} e Event object.
   * @param {object} component Internal component.
   * @param {*} contents Popup contents.
   * @param {Function} [renderedCallback] Optional render callback.
   * @param {string} [position] Popup position.
   */
  loadPopup(e, component, contents, renderedCallback, position) {
    const touch = !(e instanceof MouseEvent)

    let contentsEl
    let popup

    if (contents instanceof HTMLElement) {
      contentsEl = contents
    } else {
      contentsEl = document.createElement('div')
      contentsEl.innerHTML = contents
    }

    contentsEl.classList.add('tabulator-popup')

    contentsEl.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    if (!touch) {
      e.preventDefault()
    }

    popup = this.popup(contentsEl)

    if (typeof renderedCallback === 'function') {
      popup.renderCallback(renderedCallback)
    }

    if (e) {
      popup.show(e)
    } else {
      popup.show(component.getElement(), position || 'center')
    }

    const componentRef = component.getComponent()

    popup.hideOnBlur(() => {
      this.dispatchExternal('popupClosed', componentRef)
    })

    this.dispatchExternal('popupOpened', componentRef)
  }
}
