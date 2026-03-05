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
   */
  rangeJumpLeft(e) {
    dispatchRangeNavigation(this, e, 'left', true, false)
  },
  /**
   * Jump the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeJumpRight(e) {
    dispatchRangeNavigation(this, e, 'right', true, false)
  },
  /**
   * Jump the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeJumpUp(e) {
    dispatchRangeNavigation(this, e, 'up', true, false)
  },
  /**
   * Jump the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeJumpDown(e) {
    dispatchRangeNavigation(this, e, 'down', true, false)
  },
  /**
   * Expand the active range left.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeExpandLeft(e) {
    dispatchRangeNavigation(this, e, 'left', false, true)
  },
  /**
   * Expand the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeExpandRight(e) {
    dispatchRangeNavigation(this, e, 'right', false, true)
  },
  /**
   * Expand the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeExpandUp(e) {
    dispatchRangeNavigation(this, e, 'up', false, true)
  },
  /**
   * Expand the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeExpandDown(e) {
    dispatchRangeNavigation(this, e, 'down', false, true)
  },
  /**
   * Expand and jump the active range left.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeExpandJumpLeft(e) {
    dispatchRangeNavigation(this, e, 'left', true, true)
  },
  /**
   * Expand and jump the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeExpandJumpRight(e) {
    dispatchRangeNavigation(this, e, 'right', true, true)
  },
  /**
   * Expand and jump the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeExpandJumpUp(e) {
    dispatchRangeNavigation(this, e, 'up', true, true)
  },
  /**
   * Expand and jump the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   */
  rangeExpandJumpDown(e) {
    dispatchRangeNavigation(this, e, 'down', true, true)
  }
}
