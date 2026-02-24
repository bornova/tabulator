/**
 * SelectRange keybinding action handlers.
 *
 * @type {Object<string, function(KeyboardEvent): void>}
 */
function dispatchRangeNavigation(context, event, direction, jump, expand) {
  context.dispatch('keybinding-nav-range', event, direction, jump, expand)
}

export default {
  /**
   * Jump the active range left.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeJumpLeft(e) {
    dispatchRangeNavigation(this, e, 'left', true, false)
  },
  /**
   * Jump the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeJumpRight(e) {
    dispatchRangeNavigation(this, e, 'right', true, false)
  },
  /**
   * Jump the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeJumpUp(e) {
    dispatchRangeNavigation(this, e, 'up', true, false)
  },
  /**
   * Jump the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeJumpDown(e) {
    dispatchRangeNavigation(this, e, 'down', true, false)
  },
  /**
   * Expand the active range left.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandLeft(e) {
    dispatchRangeNavigation(this, e, 'left', false, true)
  },
  /**
   * Expand the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandRight(e) {
    dispatchRangeNavigation(this, e, 'right', false, true)
  },
  /**
   * Expand the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandUp(e) {
    dispatchRangeNavigation(this, e, 'up', false, true)
  },
  /**
   * Expand the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandDown(e) {
    dispatchRangeNavigation(this, e, 'down', false, true)
  },
  /**
   * Expand and jump the active range left.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandJumpLeft(e) {
    dispatchRangeNavigation(this, e, 'left', true, true)
  },
  /**
   * Expand and jump the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandJumpRight(e) {
    dispatchRangeNavigation(this, e, 'right', true, true)
  },
  /**
   * Expand and jump the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandJumpUp(e) {
    dispatchRangeNavigation(this, e, 'up', true, true)
  },
  /**
   * Expand and jump the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandJumpDown(e) {
    dispatchRangeNavigation(this, e, 'down', true, true)
  }
}
