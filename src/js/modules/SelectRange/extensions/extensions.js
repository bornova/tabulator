import bindings from './keybindings/bindings.js'
import actions from './keybindings/actions.js'
import pasteActions from './clipboard/pasteActions.js'
import pasteParsers from './clipboard/pasteParsers.js'
import columnLookups from './export/columnLookups.js'
import rowLookups from './export/rowLookups.js'

/**
 * SelectRange module extension configuration.
 *
 * @type {{
 *   keybindings: {bindings: object, actions: object},
 *   clipboard: {pasteActions: object, pasteParsers: object},
 *   export: {columnLookups: object, rowLookups: object}
 * }}
 */
export default {
  keybindings: {
    bindings,
    actions
  },
  clipboard: {
    pasteActions,
    pasteParsers
  },
  export: {
    columnLookups,
    rowLookups
  }
}
