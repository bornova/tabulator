import responsiveCollapse from './formatters/responsiveCollapse.js'

/**
 * ResponsiveLayout module extension configuration.
 *
 * @type {{
 *   format: {
 *     formatters: {
 *       responsiveCollapse: function(Object): HTMLDivElement
 *     }
 *   }
 * }}
 */
export default {
  format: {
    formatters: {
      responsiveCollapse
    }
  }
}
