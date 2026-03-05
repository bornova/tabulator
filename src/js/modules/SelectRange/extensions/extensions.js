import bindings from './keybindings/bindings'
import actions from './keybindings/actions'
import pasteActions from './clipboard/pasteActions'
import pasteParsers from './clipboard/pasteParsers'
import columnLookups from './export/columnLookups'
import rowLookups from './export/rowLookups'

/**
 * SelectRange module extension configuration.
 *
 * @type {{
 *   keybindings: {bindings: Object, actions: Object},
 *   clipboard: {pasteActions: Object, pasteParsers: Object},
 *   export: {columnLookups: Object, rowLookups: Object}
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
