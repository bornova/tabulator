import Module from '../../core/Module.js'

import defaultBindings from './defaults/bindings.js'
import defaultActions from './defaults/actions.js'

export default class Keybindings extends Module {
  static moduleName = 'keybindings'

  // load defaults
  static bindings = defaultBindings
  static actions = defaultActions

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.watchKeys = null
    this.pressedKeys = null
    this.keyupBinding = false
    this.keydownBinding = false

    this.registerTableOption('keybindings', {}) // array for keybindings
    this.registerTableOption('tabEndNewRow', false) // create new row when tab to end of table
  }

  /**
   * Initialize keybinding mappings and DOM listeners.
   * @returns {void}
   */
  initialize() {
    const bindings = this.table.options.keybindings
    const mergedBindings = { ...Keybindings.bindings, ...bindings }

    this.watchKeys = {}
    this.pressedKeys = []

    if (bindings !== false) {
      this.mapBindings(mergedBindings)
      this.bindEvents()
    }

    this.subscribe('table-destroy', this.clearBindings.bind(this))
  }

  /**
   * Map configured action bindings into key watch lists.
   * @param {object} bindings Binding definitions.
   * @returns {void}
   */
  mapBindings(bindings) {
    for (const key in bindings) {
      if (!Keybindings.actions[key]) {
        console.warn('Key Binding Error - no such action:', key)
        continue
      }

      if (!bindings[key]) {
        continue
      }

      const actionBindings = Array.isArray(bindings[key]) ? bindings[key] : [bindings[key]]

      actionBindings.forEach((binding) => {
        const bindingList = Array.isArray(binding) ? binding : [binding]

        bindingList.forEach((item) => {
          this.mapBinding(key, item)
        })
      })
    }
  }

  /**
   * Map one action binding string/array into normalized key metadata.
   * @param {string} action Action name.
   * @param {string|number|Array<string|number>} symbolsList Binding symbols.
   * @returns {void}
   */
  mapBinding(action, symbolsList) {
    const binding = {
      action: Keybindings.actions[action],
      keys: [],
      ctrl: false,
      shift: false,
      meta: false
    }

    const symbols = symbolsList.toString().toLowerCase().replace(/\s+/g, '').split('+')

    symbols.forEach((symbol) => {
      switch (symbol) {
        case 'ctrl':
          binding.ctrl = true
          break

        case 'shift':
          binding.shift = true
          break

        case 'meta':
          binding.meta = true
          break

        default: {
          const key = this._normalizeBindingSymbol(symbol)

          if (!key) {
            return
          }

          binding.keys.push(key)

          if (!this.watchKeys[key]) {
            this.watchKeys[key] = []
          }

          this.watchKeys[key].push(binding)
        }
      }
    })
  }

  _normalizeBindingSymbol(symbol) {
    if (!isNaN(symbol)) {
      return this._keyFromLegacyCode(parseInt(symbol, 10))
    }

    const aliases = {
      up: 'arrowup',
      down: 'arrowdown',
      left: 'arrowleft',
      right: 'arrowright',
      esc: 'escape',
      del: 'delete',
      return: 'enter',
      pgup: 'pageup',
      pgdn: 'pagedown',
      space: ' ',
      spacebar: ' '
    }

    return aliases[symbol] || symbol
  }

  _keyFromLegacyCode(code) {
    const knownCodes = {
      8: 'backspace',
      9: 'tab',
      13: 'enter',
      27: 'escape',
      32: ' ',
      33: 'pageup',
      34: 'pagedown',
      35: 'end',
      36: 'home',
      37: 'arrowleft',
      38: 'arrowup',
      39: 'arrowright',
      40: 'arrowdown',
      45: 'insert',
      46: 'delete'
    }

    if (knownCodes[code]) {
      return knownCodes[code]
    }

    if (code >= 48 && code <= 90) {
      return String.fromCharCode(code).toLowerCase()
    }

    if (code >= 96 && code <= 105) {
      return String(code - 96)
    }

    if (code >= 112 && code <= 123) {
      return `f${code - 111}`
    }

    return null
  }

  _normalizeEventKey(e) {
    const key = e.key

    if (!key) {
      return null
    }

    if (key.length === 1) {
      return key.toLowerCase()
    }

    const loweredKey = key.toLowerCase()
    const aliases = {
      esc: 'escape',
      spacebar: ' ',
      space: ' '
    }

    return aliases[loweredKey] || loweredKey
  }

  /**
   * Bind keydown/keyup listeners on the table element.
   * @returns {void}
   */
  bindEvents() {
    this.keyupBinding = (e) => {
      const key = this._normalizeEventKey(e)
      const bindings = this.watchKeys[key]

      if (bindings) {
        this.pressedKeys.push(key)

        bindings.forEach((binding) => {
          this.checkBinding(e, binding)
        })
      }
    }

    this.keydownBinding = (e) => {
      const key = this._normalizeEventKey(e)
      const bindings = this.watchKeys[key]

      if (bindings) {
        const index = this.pressedKeys.indexOf(key)

        if (index > -1) {
          this.pressedKeys.splice(index, 1)
        }
      }
    }

    this.table.element.addEventListener('keydown', this.keyupBinding)

    this.table.element.addEventListener('keyup', this.keydownBinding)
  }

  /**
   * Remove keybinding listeners from the table element.
   * @returns {void}
   */
  clearBindings() {
    if (this.keyupBinding) {
      this.table.element.removeEventListener('keydown', this.keyupBinding)
    }

    if (this.keydownBinding) {
      this.table.element.removeEventListener('keyup', this.keydownBinding)
    }
  }

  /**
   * Check a key event against a normalized binding and run action on match.
   * @param {KeyboardEvent} e Keyboard event.
   * @param {object} binding Normalized binding object.
   * @returns {boolean}
   */
  checkBinding(e, binding) {
    let match = true

    if (e.ctrlKey === binding.ctrl && e.shiftKey === binding.shift && e.metaKey === binding.meta) {
      binding.keys.forEach((key) => {
        const index = this.pressedKeys.indexOf(key)

        if (index === -1) {
          match = false
        }
      })

      if (match) {
        binding.action.call(this, e)
      }

      return true
    }

    return false
  }
}
