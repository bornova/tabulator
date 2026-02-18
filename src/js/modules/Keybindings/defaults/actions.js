/**
 * Default keybinding actions.
 *
 * @type {Object<string, function(KeyboardEvent): void>}
 */
export default {
  /**
   * Block default key handling.
   *
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  keyBlock(e) {
    e.stopPropagation()
    e.preventDefault()
  },

  /**
   * Scroll up by one page.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  scrollPageUp(e) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()
    const newPos = rowManager.scrollTop - rowManager.element.clientHeight

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      if (newPos >= 0) {
        rowManager.element.scrollTop = newPos
      } else {
        rowManager.scrollToRow(displayRows[0])
      }
    }

    this.table.element.focus()
  },

  /**
   * Scroll down by one page.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  scrollPageDown(e) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()
    const newPos = rowManager.scrollTop + rowManager.element.clientHeight
    const scrollMax = rowManager.element.scrollHeight

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      if (newPos <= scrollMax) {
        rowManager.element.scrollTop = newPos
      } else {
        rowManager.scrollToRow(displayRows[rowManager.displayRowsCount - 1])
      }
    }

    this.table.element.focus()
  },

  /**
   * Scroll to the first displayed row.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  scrollToStart(e) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      rowManager.scrollToRow(displayRows[0])
    }

    this.table.element.focus()
  },

  /**
   * Scroll to the last displayed row.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  scrollToEnd(e) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      rowManager.scrollToRow(displayRows[rowManager.displayRowsCount - 1])
    }

    this.table.element.focus()
  },

  /**
   * Dispatch navigation to previous focusable element.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  navPrev(e) {
    this.dispatch('keybinding-nav-prev', e)
  },

  /**
   * Dispatch navigation to next focusable element.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  navNext(e) {
    this.dispatch('keybinding-nav-next', e)
  },

  /**
   * Dispatch left navigation.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  navLeft(e) {
    this.dispatch('keybinding-nav-left', e)
  },

  /**
   * Dispatch right navigation.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  navRight(e) {
    this.dispatch('keybinding-nav-right', e)
  },

  /**
   * Dispatch upward navigation.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  navUp(e) {
    this.dispatch('keybinding-nav-up', e)
  },

  /**
   * Dispatch downward navigation.
   *
   * @this {Object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  navDown(e) {
    this.dispatch('keybinding-nav-down', e)
  }
}
