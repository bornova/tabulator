import rows from './pageCounters/rows'
import pages from './pageCounters/pages'

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
