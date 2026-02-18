// resize columns to fit data they contain and stretch row to fill table, also used for fitDataTable
export default function (columns, forced) {
  const table = this.table

  columns.forEach((column) => {
    column.reinitializeWidth()
  })

  if (!(table.options.responsiveLayout && table.modExists('responsiveLayout', true))) {
    return
  }

  table.modules.responsiveLayout.update()
}
