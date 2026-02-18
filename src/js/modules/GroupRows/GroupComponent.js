// public group object
export default class GroupComponent {
  /**
   * @param {object} group Internal Group instance.
   * @returns {GroupComponent}
   */
  constructor(group) {
    this._group = group
    this.type = 'GroupComponent'

    return new Proxy(this, {
      get(target, name, receiver) {
        if (Reflect.has(target, name)) {
          return Reflect.get(target, name, receiver)
        }

        return target._group.groupManager.table.componentFunctionBinder.handle('group', target._group, name)
      }
    })
  }

  /**
   * Get the group key value.
   * @returns {*}
   */
  getKey() {
    return this._group.key
  }

  /**
   * Get the group field name.
   * @returns {string}
   */
  getField() {
    return this._group.field
  }

  /**
   * Get the group DOM element.
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._group.element
  }

  /**
   * Get row components contained in this group.
   * @returns {Array<object>}
   */
  getRows() {
    return this._group.getRows(true)
  }

  /**
   * Get subgroup components contained in this group.
   * @returns {Array<object>}
   */
  getSubGroups() {
    return this._group.getSubGroups(true)
  }

  /**
   * Get parent group component.
   * @returns {object|boolean}
   */
  getParentGroup() {
    return this._group.parent ? this._group.parent.getComponent() : false
  }

  /**
   * Check whether this group is visible.
   * @returns {boolean}
   */
  isVisible() {
    return this._group.visible
  }

  /**
   * Show this group.
   * @returns {void}
   */
  show() {
    this._group.show()
  }

  /**
   * Hide this group.
   * @returns {void}
   */
  hide() {
    this._group.hide()
  }

  /**
   * Toggle this group visibility.
   * @returns {void}
   */
  toggle() {
    this._group.toggleVisibility()
  }

  /**
   * Scroll this group into view.
   * @param {string} [position] Scroll alignment position.
   * @param {boolean} [ifVisible] Only scroll if not visible when true.
   * @returns {Promise<void>|boolean}
   */
  scrollTo(position, ifVisible) {
    return this._group.groupManager.table.rowManager.scrollToRow(this._group, position, ifVisible)
  }

  /**
   * Get internal group instance.
   * @returns {object}
   */
  _getSelf() {
    return this._group
  }

  /**
   * Get parent table instance.
   * @returns {object}
   */
  getTable() {
    return this._group.groupManager.table
  }
}
