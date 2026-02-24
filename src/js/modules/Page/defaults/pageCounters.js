import rows from './pageCounters/rows.js'
import pages from './pageCounters/pages.js'

/**
 * Default page counter formatters.
 *
 * @type {{
 *   rows: function(number, number, number, number, number): HTMLElement,
 *   pages: function(number, number, number, number, number): HTMLElement
 * }}
 */
export default {
  rows,
  pages
}
