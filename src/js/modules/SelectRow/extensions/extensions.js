import rowSelection from './formatters/rowSelection.js'

/**
 * SelectRow module extension configuration.
 *
 * @type {{
 *   format: {
 *     formatters: {
 *       rowSelection: function(Object, Object=): HTMLInputElement|string
 *     }
 *   }
 * }}
 */
export default {
  format: {
    formatters: {
      rowSelection
    }
  }
}
