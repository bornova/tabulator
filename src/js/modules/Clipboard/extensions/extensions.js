import bindings from './keybindings/bindings.js'
import actions from './keybindings/actions.js'

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
