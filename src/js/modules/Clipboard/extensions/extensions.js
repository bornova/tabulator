import bindings from './keybindings/bindings'
import actions from './keybindings/actions'

/**
 * Clipboard module extension configuration.
 *
 * @type {{
 *   keybindings: {
 *     bindings: object,
 *     actions: object
 *   }
 * }}
 */
export default {
  keybindings: {
    bindings,
    actions
  }
}
