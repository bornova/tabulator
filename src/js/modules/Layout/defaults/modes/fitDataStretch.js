// resize columns to fit data the contain and stretch last column to fill table
/**
 * Resize columns to fit content and stretch the last visible column.
 *
 * @this {Object}
 * @param {Array<Object>} columns Columns to resize.
 * @param {boolean} forced Force recalculation.
 * @returns {void}
 */
export default function (columns, forced) {
  void forced
  const table = this.table
  const hasResponsiveLayout = table.options.responsiveLayout && table.modExists('responsiveLayout', true)
  let colsWidth = 0
  const tableWidth = table.rowManager.element.clientWidth
  let gap
  let lastCol = false

  columns.forEach((column) => {
    if (!column.widthFixed) {
      column.reinitializeWidth()
    }

    if (hasResponsiveLayout ? column.modules.responsive.visible : column.visible) {
      lastCol = column
    }

    if (column.visible) {
      colsWidth += column.getWidth()
    }
  })

  if (lastCol) {
    gap = tableWidth - colsWidth + lastCol.getWidth()

    if (hasResponsiveLayout) {
      lastCol.setWidth(0)
      table.modules.responsiveLayout.update()
    }

    if (gap > 0) {
      lastCol.setWidth(gap)
    } else {
      lastCol.reinitializeWidth()
    }
    return
  }

  if (hasResponsiveLayout) {
    table.modules.responsiveLayout.update()
  }
}
