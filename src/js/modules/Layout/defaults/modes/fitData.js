// resize columns to fit data they contain
export default function (columns, forced) {
  const table = this.table

  if (forced) {
    table.columnManager.renderer.reinitializeColumnWidths(columns)
  }

  if (!(table.options.responsiveLayout && table.modExists('responsiveLayout', true))) {
    return
  }

  table.modules.responsiveLayout.update()
}
