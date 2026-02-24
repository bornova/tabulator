// resize columns to fit data they contain and stretch row to fill table, also used for fitDataTable
/**
 * Resize columns to fit content and optionally update responsive layout.
 *
 * @this {Object}
 * @param {Array<Object>} columns Columns to resize.
 * @returns {void}
 */
export default function (columns) {
  const table = this.table
  const hasResponsiveLayout = table.options.responsiveLayout && table.modExists('responsiveLayout', true)

  columns.forEach((column) => {
    column.reinitializeWidth()
  })

  if (!hasResponsiveLayout) {
    return
  }

  table.modules.responsiveLayout.update()
}
