// resize columns to fit data they contain
/**
 * Resize columns to fit their content.
 *
 * @this {Object}
 * @param {Array<Object>} columns Columns to resize.
 * @param {boolean} forced Force width reinitialization.
 * @returns {void}
 */
export default function (columns, forced) {
  const table = this.table
  const hasResponsiveLayout = table.options.responsiveLayout && table.modExists('responsiveLayout', true)

  if (forced) {
    table.columnManager.renderer.reinitializeColumnWidths(columns)
  }

  if (!hasResponsiveLayout) {
    return
  }

  table.modules.responsiveLayout.update()
}
