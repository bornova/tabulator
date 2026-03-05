import responsiveCollapse from './formatters/responsiveCollapse'

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
