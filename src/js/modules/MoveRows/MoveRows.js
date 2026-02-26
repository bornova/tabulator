import Module from '../../core/Module.js'
import Helpers from '../../core/tools/Helpers.js'

import defaultSenders from './defaults/senders.js'
import defaultReceivers from './defaults/receivers.js'

export default class MoveRows extends Module {
  static moduleName = 'moveRow'

  // load defaults
  static senders = defaultSenders
  static receivers = defaultReceivers

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.placeholderElement = this.createPlaceholderElement()
    this.hoverElement = false // floating row header element
    this.checkTimeout = false // click check timeout holder
    this.checkPeriod = 150 // period to wait on mousedown to consider this a move and not a click
    this.moving = false // currently moving row
    this.toRow = false // destination row
    this.toRowAfter = false // position of moving row relative to the destination row
    this.hasHandle = false // row has handle instead of fully movable row
    this.startY = 0 // starting Y position within header element
    this.startX = 0 // starting X position within header element

    this.moveHover = this.moveHover.bind(this)
    this.endMove = this.endMove.bind(this)
    this.tableRowDropEvent = false

    this.touchMove = false

    this.connection = false
    this.connectionSelectorsTables = false
    this.connectionSelectorsElements = false
    this.connectionElements = []
    this.connections = []

    this.connectedTable = false
    this.connectedRow = false

    this.registerTableOption('movableRows', false) // enable movable rows
    this.registerTableOption('movableRowsConnectedTables', false) // tables for movable rows to be connected to
    this.registerTableOption('movableRowsConnectedElements', false) // other elements for movable rows to be connected to
    this.registerTableOption('movableRowsSender', false)
    this.registerTableOption('movableRowsReceiver', 'insert')
    this.registerTableOption('movableRowsElementDrop', false)

    this.registerColumnOption('rowHandle')
  }

  /**
   * Create placeholder row element used during drag.
   * @returns {HTMLDivElement}
   */
  createPlaceholderElement() {
    const el = document.createElement('div')

    el.classList.add('tabulator-row')
    el.classList.add('tabulator-row-placeholder')

    return el
  }

  /**
   * Initialize row move behavior and subscriptions.
   */
  initialize() {
    if (this.table.options.movableRows) {
      this.connectionSelectorsTables = this.table.options.movableRowsConnectedTables
      this.connectionSelectorsElements = this.table.options.movableRowsConnectedElements

      this.connection = this.connectionSelectorsTables || this.connectionSelectorsElements

      this.subscribe('cell-init', this.initializeCell.bind(this))
      this.subscribe('column-init', this.initializeColumn.bind(this))
      this.subscribe('row-init', this.initializeRow.bind(this))
    }
  }

  /**
   * Determine whether a pointer event can start row move.
   * @param {Event} e Input event.
   * @returns {boolean}
   */
  canStartMoveFromEvent(e) {
    const target = e ? e.target : null

    if (!target || typeof target.closest !== 'function') {
      return true
    }

    if (target.closest('input, textarea, select, button, option, [contenteditable], a[href]')) {
      return false
    }

    if (this.table.modExists('edit') && this.table.modules.edit.currentCell) {
      return false
    }

    return true
  }

  /**
   * Initialize drag/drop handlers for group headers.
   * @param {object} group Group row.
   */
  initializeGroupHeader(group) {
    const config = {}

    // inter table drag drop
    config.mouseup = (e) => {
      this.tableRowDrop(e, group)
    }

    // same table drag drop
    config.mousemove = (e) => {
      let rowEl

      if (
        e.pageY - Helpers.elOffset(group.element).top + this.table.rowManager.element.scrollTop >
        group.getHeight() / 2
      ) {
        if (this.toRow !== group || !this.toRowAfter) {
          rowEl = group.getElement()
          rowEl.parentNode.insertBefore(this.placeholderElement, rowEl.nextSibling)
          this.moveRow(group, true)
        }
      } else {
        if (this.toRow !== group || this.toRowAfter) {
          rowEl = group.getElement()
          if (rowEl.previousSibling) {
            rowEl.parentNode.insertBefore(this.placeholderElement, rowEl)
            this.moveRow(group, false)
          }
        }
      }
    }

    group.modules.moveRow = config
  }

  /**
   * Initialize drag/drop handlers for a row.
   * @param {object} row Internal row.
   */
  initializeRow(row) {
    const config = {}

    let rowEl

    // inter table drag drop
    config.mouseup = (e) => {
      this.tableRowDrop(e, row)
    }

    // same table drag drop
    config.mousemove = (e) => {
      const rowEl = row.getElement()

      if (e.pageY - Helpers.elOffset(rowEl).top + this.table.rowManager.element.scrollTop > row.getHeight() / 2) {
        if (this.toRow !== row || !this.toRowAfter) {
          rowEl.parentNode.insertBefore(this.placeholderElement, rowEl.nextSibling)
          this.moveRow(row, true)
        }
      } else {
        if (this.toRow !== row || this.toRowAfter) {
          rowEl.parentNode.insertBefore(this.placeholderElement, rowEl)
          this.moveRow(row, false)
        }
      }
    }

    if (!this.hasHandle) {
      rowEl = row.getElement()

      rowEl.addEventListener('mousedown', (e) => {
        if (e.button === 0 && this.canStartMoveFromEvent(e)) {
          this.checkTimeout = setTimeout(() => {
            this.startMove(e, row)
          }, this.checkPeriod)
        }
      })

      rowEl.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          if (this.checkTimeout) {
            clearTimeout(this.checkTimeout)
          }
        }
      })

      this.bindTouchEvents(row, row.getElement())
    }

    row.modules.moveRow = config
  }

  /**
   * Detect whether a row-handle column exists.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    if (column.definition.rowHandle && this.table.options.movableRows !== false) {
      this.hasHandle = true
    }
  }

  /**
   * Initialize drag behavior on row-handle cells.
   * @param {object} cell Internal cell.
   */
  initializeCell(cell) {
    if (cell.column.definition.rowHandle && this.table.options.movableRows !== false) {
      const cellEl = cell.getElement(true)

      cellEl.addEventListener('mousedown', (e) => {
        if (e.button === 0 && this.canStartMoveFromEvent(e)) {
          this.checkTimeout = setTimeout(() => {
            this.startMove(e, cell.row)
          }, this.checkPeriod)
        }
      })

      cellEl.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
          if (this.checkTimeout) {
            clearTimeout(this.checkTimeout)
          }
        }
      })

      this.bindTouchEvents(cell.row, cellEl)
    }
  }

  /**
   * Bind touch drag handlers to a row trigger element.
   * @param {object} row Internal row.
   * @param {HTMLElement} element Trigger element.
   */
  bindTouchEvents(row, element) {
    let startYMove = false // shifting center position of the cell
    let nextRow
    let prevRow
    let nextRowHeight
    let prevRowHeight
    let nextRowHeightLast
    let prevRowHeightLast

    element.addEventListener(
      'touchstart',
      (e) => {
        if (!this.canStartMoveFromEvent(e)) {
          return
        }

        this.checkTimeout = setTimeout(() => {
          this.touchMove = true
          nextRow = row.nextRow()
          nextRowHeight = nextRow ? nextRow.getHeight() / 2 : 0
          prevRow = row.prevRow()
          prevRowHeight = prevRow ? prevRow.getHeight() / 2 : 0
          nextRowHeightLast = 0
          prevRowHeightLast = 0
          startYMove = false

          this.startMove(e, row)
        }, this.checkPeriod)
      },
      { passive: true }
    )

    element.addEventListener('touchmove', (e) => {
      let diff, moveToRow

      if (this.moving) {
        e.preventDefault()

        this.moveHover(e)

        if (!startYMove) {
          startYMove = e.touches[0].pageY
        }

        diff = e.touches[0].pageY - startYMove

        if (diff > 0) {
          if (nextRow && diff - nextRowHeightLast > nextRowHeight) {
            moveToRow = nextRow

            if (moveToRow !== row) {
              startYMove = e.touches[0].pageY
              moveToRow
                .getElement()
                .parentNode.insertBefore(this.placeholderElement, moveToRow.getElement().nextSibling)
              this.moveRow(moveToRow, true)
            }
          }
        } else {
          if (prevRow && -diff - prevRowHeightLast > prevRowHeight) {
            moveToRow = prevRow

            if (moveToRow !== row) {
              startYMove = e.touches[0].pageY
              moveToRow.getElement().parentNode.insertBefore(this.placeholderElement, moveToRow.getElement())
              this.moveRow(moveToRow, false)
            }
          }
        }

        if (moveToRow) {
          nextRow = moveToRow.nextRow()
          nextRowHeightLast = nextRowHeight
          nextRowHeight = nextRow ? nextRow.getHeight() / 2 : 0
          prevRow = moveToRow.prevRow()
          prevRowHeightLast = prevRowHeight
          prevRowHeight = prevRow ? prevRow.getHeight() / 2 : 0
        }
      }
    })

    element.addEventListener('touchend', (e) => {
      if (this.checkTimeout) {
        clearTimeout(this.checkTimeout)
      }
      if (this.moving) {
        this.endMove(e)
        this.touchMove = false
      }
    })
  }

  /**
   * Bind row mousemove listeners used while dragging.
   */
  _bindMouseMove() {
    this.table.rowManager.getDisplayRows().forEach((row) => {
      if ((row.type === 'row' || row.type === 'group') && row.modules.moveRow && row.modules.moveRow.mousemove) {
        row.getElement().addEventListener('mousemove', row.modules.moveRow.mousemove)
      }
    })
  }

  /**
   * Unbind row mousemove listeners used while dragging.
   */
  _unbindMouseMove() {
    this.table.rowManager.getDisplayRows().forEach((row) => {
      if ((row.type === 'row' || row.type === 'group') && row.modules.moveRow && row.modules.moveRow.mousemove) {
        row.getElement().removeEventListener('mousemove', row.modules.moveRow.mousemove)
      }
    })
  }

  /**
   * Start row move operation.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @param {object} row Internal row.
   */
  startMove(e, row) {
    const element = row.getElement()

    this.setStartPosition(e, row)

    this.moving = row

    this.table.element.classList.add('tabulator-block-select')

    // create placeholder
    this.placeholderElement.style.width = `${row.getWidth()}px`
    this.placeholderElement.style.height = `${row.getHeight()}px`

    if (!this.connection) {
      element.parentNode.insertBefore(this.placeholderElement, element)
      element.parentNode.removeChild(element)
    } else {
      this.table.element.classList.add('tabulator-movingrow-sending')
      this.connectToTables(row)
    }

    // create hover element
    this.hoverElement = element.cloneNode(true)
    this.hoverElement.classList.add('tabulator-moving')

    if (this.connection) {
      document.body.appendChild(this.hoverElement)
      this.hoverElement.classList.add('tabulator-moving-origin')
      this.hoverElement.style.width = `${this.table.element.clientWidth}px`
      this.hoverElement.classList.add('tabulator-moving-nowrap')
    } else {
      this.table.rowManager.getTableElement().appendChild(this.hoverElement)

      this.hoverElement.classList.add('tabulator-moving-origin')

      this._bindMouseMove()
    }

    document.body.addEventListener('mousemove', this.moveHover)
    document.body.addEventListener('mouseup', this.endMove)

    this.dispatchExternal('rowMoving', row.getComponent())

    this.moveHover(e)
  }

  /**
   * Capture pointer offset for drag start.
   * @param {MouseEvent|TouchEvent} e Input event.
   * @param {object} row Internal row.
   */
  setStartPosition(e, row) {
    const pageX = this.touchMove ? e.touches[0].pageX : e.pageX
    const pageY = this.touchMove ? e.touches[0].pageY : e.pageY

    let element
    let position

    element = row.getElement()
    if (this.connection) {
      position = element.getBoundingClientRect()

      this.startX = position.left - pageX + window.pageXOffset
      this.startY = position.top - pageY + window.pageYOffset
    } else {
      this.startY = pageY - element.getBoundingClientRect().top
    }
  }

  /**
   * Finalize row move operation.
   * @param {MouseEvent|TouchEvent} [e] Input event.
   */
  endMove(e) {
    if (!e || e.button === 0 || this.touchMove) {
      this._unbindMouseMove()

      if (!this.connection) {
        if (this.placeholderElement.parentNode) {
          this.placeholderElement.parentNode.insertBefore(this.moving.getElement(), this.placeholderElement.nextSibling)
          this.placeholderElement.parentNode.removeChild(this.placeholderElement)
        }
      }

      if (this.hoverElement && this.hoverElement.parentNode) {
        this.hoverElement.parentNode.removeChild(this.hoverElement)
      }

      this.table.element.classList.remove('tabulator-block-select')

      if (this.toRow) {
        this.table.rowManager.moveRow(this.moving, this.toRow, this.toRowAfter)
      } else {
        this.dispatchExternal('rowMoveCancelled', this.moving.getComponent())
      }

      this.moving = false
      this.toRow = false
      this.toRowAfter = false

      document.body.removeEventListener('mousemove', this.moveHover)
      document.body.removeEventListener('mouseup', this.endMove)

      if (this.connection) {
        this.table.element.classList.remove('tabulator-movingrow-sending')
        this.disconnectFromTables()
      }
    }
  }

  /**
   * Update row drop target.
   * @param {object} row Target row.
   * @param {boolean} after Insert-after flag.
   */
  moveRow(row, after) {
    this.toRow = row
    this.toRowAfter = after
  }

  /**
   * Move hover element in active drag context.
   * @param {MouseEvent|TouchEvent} e Input event.
   */
  moveHover(e) {
    if (this.connection) {
      this.moveHoverConnections.call(this, e)
    } else {
      this.moveHoverTable.call(this, e)
    }
  }

  /**
   * Move hover element for same-table row drag.
   * @param {MouseEvent|TouchEvent} e Input event.
   */
  moveHoverTable(e) {
    const rowHolder = this.table.rowManager.getElement()
    const scrollTop = rowHolder.scrollTop
    const yPos = (this.touchMove ? e.touches[0].pageY : e.pageY) - rowHolder.getBoundingClientRect().top + scrollTop

    this.hoverElement.style.top = `${Math.min(
      yPos - this.startY,
      this.table.rowManager.element.scrollHeight - this.hoverElement.offsetHeight
    )}px`
  }

  /**
   * Move hover element for connected drag targets.
   * @param {MouseEvent|TouchEvent} e Input event.
   */
  moveHoverConnections(e) {
    this.hoverElement.style.left = `${this.startX + (this.touchMove ? e.touches[0].pageX : e.pageX)}px`
    this.hoverElement.style.top = `${this.startY + (this.touchMove ? e.touches[0].pageY : e.pageY)}px`
  }

  /**
   * Dispatch external drop event for connected DOM elements.
   * @param {Event} e Drop event.
   * @param {HTMLElement} element Drop target element.
   * @param {object} row Internal row.
   */
  elementRowDrop(e, element, row) {
    this.dispatchExternal('movableRowsElementDrop', e, element, row ? row.getComponent() : false)
  }

  // establish connection with other tables
  /**
   * Connect drag sender to configured tables/elements.
   * @param {object} row Internal row.
   */
  connectToTables(row) {
    let connectionTables

    if (this.connectionSelectorsTables) {
      connectionTables = this.commsConnections(this.connectionSelectorsTables)

      this.dispatchExternal('movableRowsSendingStart', connectionTables)

      this.commsSend(this.connectionSelectorsTables, 'moveRow', 'connect', {
        row
      })
    }

    if (this.connectionSelectorsElements) {
      this.connectionElements = []
      const selectors = Array.isArray(this.connectionSelectorsElements)
        ? this.connectionSelectorsElements
        : [this.connectionSelectorsElements]

      selectors.forEach((query) => {
        if (typeof query === 'string') {
          this.connectionElements = this.connectionElements.concat(Array.from(document.querySelectorAll(query)))
        } else {
          this.connectionElements.push(query)
        }
      })

      this.connectionElements.forEach((element) => {
        const dropEvent = (e) => {
          this.elementRowDrop(e, element, this.moving)
        }

        element.addEventListener('mouseup', dropEvent)
        element.tabulatorElementDropEvent = dropEvent

        element.classList.add('tabulator-movingrow-receiving')
      })
    }
  }

  // disconnect from other tables
  /**
   * Disconnect drag sender from configured tables/elements.
   */
  disconnectFromTables() {
    let connectionTables

    if (this.connectionSelectorsTables) {
      connectionTables = this.commsConnections(this.connectionSelectorsTables)

      this.dispatchExternal('movableRowsSendingStop', connectionTables)

      this.commsSend(this.connectionSelectorsTables, 'moveRow', 'disconnect')
    }

    this.connectionElements.forEach((element) => {
      element.classList.remove('tabulator-movingrow-receiving')
      element.removeEventListener('mouseup', element.tabulatorElementDropEvent)
      delete element.tabulatorElementDropEvent
    })
  }

  // accept incomming connection
  /**
   * Accept incoming row-drag connection from another table.
   * @param {object} table Connected table.
   * @param {object} row Connected row.
   * @returns {boolean}
   */
  connect(table, row) {
    if (!this.connectedTable) {
      this.connectedTable = table
      this.connectedRow = row

      this.table.element.classList.add('tabulator-movingrow-receiving')

      this.table.rowManager.getDisplayRows().forEach((row) => {
        if (row.type === 'row' && row.modules.moveRow && row.modules.moveRow.mouseup) {
          row.getElement().addEventListener('mouseup', row.modules.moveRow.mouseup)
        }
      })

      this.tableRowDropEvent = this.tableRowDrop.bind(this)

      this.table.element.addEventListener('mouseup', this.tableRowDropEvent)

      this.dispatchExternal('movableRowsReceivingStart', row, table)

      return true
    } else {
      console.warn('Move Row Error - Table cannot accept connection, already connected to table:', this.connectedTable)
      return false
    }
  }

  // close incoming connection
  /**
   * Close incoming row-drag connection.
   * @param {object} table Connected table.
   */
  disconnect(table) {
    if (table === this.connectedTable) {
      this.connectedTable = false
      this.connectedRow = false

      this.table.element.classList.remove('tabulator-movingrow-receiving')

      this.table.rowManager.getDisplayRows().forEach((row) => {
        if (row.type === 'row' && row.modules.moveRow && row.modules.moveRow.mouseup) {
          row.getElement().removeEventListener('mouseup', row.modules.moveRow.mouseup)
        }
      })

      this.table.element.removeEventListener('mouseup', this.tableRowDropEvent)

      this.dispatchExternal('movableRowsReceivingStop', table)
    } else {
      console.warn('Move Row Error - trying to disconnect from non connected table')
    }
  }

  /**
   * Complete sender-side drop handling.
   * @param {object} table Receiving table.
   * @param {object} row Target row.
   * @param {boolean} success Drop success flag.
   */
  dropComplete(table, row, success) {
    let sender = false

    if (success) {
      switch (typeof this.table.options.movableRowsSender) {
        case 'string':
          sender = MoveRows.senders[this.table.options.movableRowsSender]
          break

        case 'function':
          sender = this.table.options.movableRowsSender
          break
      }

      if (sender) {
        sender.call(
          this,
          this.moving ? this.moving.getComponent() : undefined,
          row ? row.getComponent() : undefined,
          table
        )
      } else {
        if (this.table.options.movableRowsSender) {
          console.warn('Mover Row Error - no matching sender found:', this.table.options.movableRowsSender)
        }
      }

      this.dispatchExternal('movableRowsSent', this.moving.getComponent(), row ? row.getComponent() : undefined, table)
    } else {
      this.dispatchExternal(
        'movableRowsSentFailed',
        this.moving.getComponent(),
        row ? row.getComponent() : undefined,
        table
      )
    }

    this.endMove()
  }

  /**
   * Handle drop on receiving table.
   * @param {Event} e Drop event.
   * @param {object} row Target row.
   */
  tableRowDrop(e, row) {
    let receiver = false
    let success = false

    e.stopImmediatePropagation()

    switch (typeof this.table.options.movableRowsReceiver) {
      case 'string':
        receiver = MoveRows.receivers[this.table.options.movableRowsReceiver]
        break

      case 'function':
        receiver = this.table.options.movableRowsReceiver
        break
    }

    if (receiver) {
      success = receiver.call(
        this,
        this.connectedRow.getComponent(),
        row ? row.getComponent() : undefined,
        this.connectedTable
      )
    } else {
      console.warn('Mover Row Error - no matching receiver found:', this.table.options.movableRowsReceiver)
    }

    if (success) {
      this.dispatchExternal(
        'movableRowsReceived',
        this.connectedRow.getComponent(),
        row ? row.getComponent() : undefined,
        this.connectedTable
      )
    } else {
      this.dispatchExternal(
        'movableRowsReceivedFailed',
        this.connectedRow.getComponent(),
        row ? row.getComponent() : undefined,
        this.connectedTable
      )
    }

    this.commsSend(this.connectedTable, 'moveRow', 'dropcomplete', {
      row,
      success
    })
  }

  /**
   * Handle move-row module communication actions.
   * @param {object} table Remote table.
   * @param {string} action Action key.
   * @param {object} data Action payload.
   * @returns {*}
   */
  commsReceived(table, action, data) {
    switch (action) {
      case 'connect':
        return this.connect(table, data.row)

      case 'disconnect':
        return this.disconnect(table)

      case 'dropcomplete':
        return this.dropComplete(table, data.row, data.success)
    }
  }
}
