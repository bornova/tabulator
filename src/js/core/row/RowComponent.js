// public row object
/** @typedef {import('../cell/CellComponent').default} CellComponent */
/** @typedef {import('../Tabulator').default} Tabulator */
/** @typedef {import('../../modules/GroupRows/GroupComponent').default} GroupComponent */
/** @typedef {import('../../modules/SelectRange/RangeComponent').default} RangeComponent */

export default class RowComponent {
  /**
   * @param {object} row Internal Row instance.
   */
  constructor(row) {
    this._row = row

    return new Proxy(this, {
      get(target, name, receiver) {
        if (typeof name === 'symbol') {
          return Reflect.get(target, name, receiver)
        }

        if (name in target) {
          return target[name]
        }

        return target._row.table.componentFunctionBinder.handle('row', target._row, name)
      }
    })
  }

  /**
   * Get row data.
   * @param {"data" | "download" | "clipboard"} [transform] Optional transform lookup key.
   * @returns {Record<string, any>}
   */
  getData(transform) {
    return this._row.getData(transform)
  }

  /**
   * Get the row DOM element.
   * @returns {HTMLElement|boolean}
   */
  getElement() {
    return this._row.getElement()
  }

  /**
   * Get all cell components in this row.
   * @returns {Array<CellComponent>}
   */
  getCells() {
    return this._row.getCells().map((cell) => cell.getComponent())
  }

  /**
   * Get a cell component by column lookup.
   * @param {import('../column/ColumnComponent').default|HTMLElement|string} column Column lookup accepted by column manager.
   * @returns {CellComponent|false}
   */
  getCell(column) {
    const cell = this._row.getCell(column)

    return cell ? cell.getComponent() : false
  }

  /**
   * Get the row index value.
   */
  getIndex() {
    return this._row.getData('data')[this._row.table.options.index]
  }

  /**
   * Get current row display position.
   * @param {boolean} [filteredPosition] If true, restrict to currently filtered/sorted data.
   * @returns {number|false}
   */
  getPosition(filteredPosition) {
    return this._row.getPosition(filteredPosition)
  }

  /**
   * Subscribe to row position changes.
   * @param {Function} callback Position update callback.
   */
  watchPosition(callback) {
    return this._row.watchPosition(callback)
  }

  /**
   * Delete this row.
   * @returns {Promise<void>}
   */
  delete() {
    return this._row.delete()
  }

  /**
   * Scroll this row into view.
   * @param {"top" | "center" | "bottom" | "nearest"} [position] Scroll alignment position.
   * @param {boolean} [ifVisible] Skip scroll when the row is already visible.
   * @returns {Promise<void>}
   */
  scrollTo(position, ifVisible) {
    return this._row.table.rowManager.scrollToRow(this._row, position, ifVisible)
  }

  /**
   * Move this row relative to another row.
   * @param {RowComponent|HTMLElement|number} to Target row lookup.
   * @param {boolean} [after] Insert after target when true.
   */
  move(to, after) {
    this._row.moveToRow(to, after)
  }

  /**
   * Update this row's data.
   * @param {object|string} data Partial update object or serialized JSON.
   * @returns {Promise<void>}
   */
  update(data) {
    return this._row.updateData(data)
  }

  /**
   * Force row height normalization.
   */
  normalizeHeight() {
    this._row.normalizeHeight(true)
  }

  /**
   * Get internal row instance.
   * @returns {object}
   */
  _getSelf() {
    return this._row
  }

  /**
   * Reinitialize row formatting and layout.
   */
  reformat() {
    return this._row.reinitialize()
  }

  /**
   * Get parent table instance.
   * @returns {Tabulator}
   */
  getTable() {
    return this._row.table
  }

  /**
   * Get the next displayed row component.
   * @returns {RowComponent|false}
   */
  getNextRow() {
    const row = this._row.nextRow()

    return row ? row.getComponent() : row
  }

  /**
   * Get the previous displayed row component.
   * @returns {RowComponent|false}
   */
  getPrevRow() {
    const row = this._row.prevRow()

    return row ? row.getComponent() : row
  }

  _callBinder(name, ...args) {
    const handler = this._row.table.componentFunctionBinder.handle('row', this._row, name)
    if (handler) {
      return handler(...args)
    }
    throw new Error(`Module providing row component function '${name}' is not installed.`)
  }

  /**
   * When the tree structure is enabled, collapse current row and hide its children.
   */
  treeCollapse() {
    this._callBinder('treeCollapse')
  }

  /**
   * When the tree structure is enabled, expand current row and show its children.
   */
  treeExpand() {
    this._callBinder('treeExpand')
  }

  /**
   * When the tree structure is enabled, toggle the collapsed state of the current row.
   */
  treeToggle() {
    this._callBinder('treeToggle')
  }

  /**
   * When the tree structure is enabled, get the parent RowComponent.
   * @returns {RowComponent|false} Parent row component or false.
   */
  getTreeParent() {
    return this._callBinder('getTreeParent')
  }

  /**
   * When the tree structure is enabled, get the children RowComponents.
   * @returns {RowComponent[]} Child row components.
   */
  getTreeChildren() {
    return this._callBinder('getTreeChildren')
  }

  /**
   * Add child rows to a data tree row.
   * @param {object} rowData Child row data.
   * @param {boolean} [position] Top (true) or bottom (false).
   * @param {RowComponent} [existingRow] Target child row reference.
   */
  addTreeChild(rowData, position, existingRow) {
    this._callBinder('addTreeChild', rowData, position, existingRow)
  }

  /**
   * Check if the tree row is expanded.
   * @returns {boolean} True if expanded.
   */
  isTreeExpanded() {
    return this._callBinder('isTreeExpanded')
  }

  /**
   * Get the group component for this row.
   * @returns {GroupComponent} Group component.
   */
  getGroup() {
    return this._callBinder('getGroup')
  }

  /**
   * Get all ranges that overlap this row.
   * @returns {RangeComponent[]} Array of Range Components.
   */
  getRanges() {
    return this._callBinder('getRanges')
  }

  /**
   * Freeze this row.
   */
  freeze() {
    this._callBinder('freeze')
  }

  /**
   * Unfreeze this row.
   */
  unfreeze() {
    this._callBinder('unfreeze')
  }

  /**
   * Check if this row is frozen.
   * @returns {boolean} True if frozen.
   */
  isFrozen() {
    return this._callBinder('isFrozen')
  }

  /**
   * Select this row.
   */
  select() {
    this._callBinder('select')
  }

  /**
   * Deselect this row.
   */
  deselect() {
    this._callBinder('deselect')
  }

  /**
   * Toggle selected state of this row.
   */
  toggleSelect() {
    this._callBinder('toggleSelect')
  }

  /**
   * Check if this row is selected.
   * @returns {boolean} True if selected.
   */
  isSelected() {
    return this._callBinder('isSelected')
  }

  /**
   * Open popup menu.
   * @param {string} contents Popup content.
   * @param {"click" | "right" | "bottom" | "left" | "top" | "center"} [position] Popup position.
   */
  popup(contents, position) {
    this._callBinder('popup', contents, position)
  }

  /**
   * Validate this row.
   * @returns {boolean|CellComponent[]} True if valid, or array of failed cell components.
   */
  validate() {
    return this._callBinder('validate')
  }

  /**
   * Load the page containing this row.
   * @returns {Promise<void>}
   */
  pageTo() {
    return this._callBinder('pageTo')
  }
}
