import bindings from './keybindings/bindings.js'
import actions from './keybindings/actions.js'

/**
 * History module extension configuration.
 *
 * @type {{
 *   keybindings: {
 *     bindings: object,
 *     actions: object
 *   }
 * }}
 */
const extensions = {
  keybindings: {
    bindings,
    actions
  }
}

export default extensions
