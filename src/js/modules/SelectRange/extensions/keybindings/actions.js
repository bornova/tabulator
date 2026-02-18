/**
 * SelectRange keybinding action handlers.
 *
 * @type {Object<string, function(KeyboardEvent): void>}
 */
export default {
  /**
   * Jump the active range left.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeJumpLeft(e) {
    this.dispatch('keybinding-nav-range', e, 'left', true, false)
  },
  /**
   * Jump the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeJumpRight(e) {
    this.dispatch('keybinding-nav-range', e, 'right', true, false)
  },
  /**
   * Jump the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeJumpUp(e) {
    this.dispatch('keybinding-nav-range', e, 'up', true, false)
  },
  /**
   * Jump the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeJumpDown(e) {
    this.dispatch('keybinding-nav-range', e, 'down', true, false)
  },
  /**
   * Expand the active range left.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandLeft(e) {
    this.dispatch('keybinding-nav-range', e, 'left', false, true)
  },
  /**
   * Expand the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandRight(e) {
    this.dispatch('keybinding-nav-range', e, 'right', false, true)
  },
  /**
   * Expand the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandUp(e) {
    this.dispatch('keybinding-nav-range', e, 'up', false, true)
  },
  /**
   * Expand the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandDown(e) {
    this.dispatch('keybinding-nav-range', e, 'down', false, true)
  },
  /**
   * Expand and jump the active range left.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandJumpLeft(e) {
    this.dispatch('keybinding-nav-range', e, 'left', true, true)
  },
  /**
   * Expand and jump the active range right.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandJumpRight(e) {
    this.dispatch('keybinding-nav-range', e, 'right', true, true)
  },
  /**
   * Expand and jump the active range up.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandJumpUp(e) {
    this.dispatch('keybinding-nav-range', e, 'up', true, true)
  },
  /**
   * Expand and jump the active range down.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  rangeExpandJumpDown(e) {
    this.dispatch('keybinding-nav-range', e, 'down', true, true)
  }
}
