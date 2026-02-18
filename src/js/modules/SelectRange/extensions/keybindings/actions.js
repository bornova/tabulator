export default {
  rangeJumpLeft(e) {
    this.dispatch('keybinding-nav-range', e, 'left', true, false)
  },
  rangeJumpRight(e) {
    this.dispatch('keybinding-nav-range', e, 'right', true, false)
  },
  rangeJumpUp(e) {
    this.dispatch('keybinding-nav-range', e, 'up', true, false)
  },
  rangeJumpDown(e) {
    this.dispatch('keybinding-nav-range', e, 'down', true, false)
  },
  rangeExpandLeft(e) {
    this.dispatch('keybinding-nav-range', e, 'left', false, true)
  },
  rangeExpandRight(e) {
    this.dispatch('keybinding-nav-range', e, 'right', false, true)
  },
  rangeExpandUp(e) {
    this.dispatch('keybinding-nav-range', e, 'up', false, true)
  },
  rangeExpandDown(e) {
    this.dispatch('keybinding-nav-range', e, 'down', false, true)
  },
  rangeExpandJumpLeft(e) {
    this.dispatch('keybinding-nav-range', e, 'left', true, true)
  },
  rangeExpandJumpRight(e) {
    this.dispatch('keybinding-nav-range', e, 'right', true, true)
  },
  rangeExpandJumpUp(e) {
    this.dispatch('keybinding-nav-range', e, 'up', true, true)
  },
  rangeExpandJumpDown(e) {
    this.dispatch('keybinding-nav-range', e, 'down', true, true)
  }
}
