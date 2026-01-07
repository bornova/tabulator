// resize columns to fit data the contain and stretch last column to fill table
export default function (columns, forced) {
	let colsWidth = 0
	const tableWidth = this.table.rowManager.element.clientWidth
	let gap = 0
	let lastCol = false

	columns.forEach((column, i) => {
		if (!column.widthFixed) {
			column.reinitializeWidth()
		}

		if (this.table.options.responsiveLayout ? column.modules.responsive.visible : column.visible) {
			lastCol = column
		}

		if (column.visible) {
			colsWidth += column.getWidth()
		}
	})

	if (lastCol) {
		gap = tableWidth - colsWidth + lastCol.getWidth()

		if (this.table.options.responsiveLayout && this.table.modExists('responsiveLayout', true)) {
			lastCol.setWidth(0)
			this.table.modules.responsiveLayout.update()
		}

		if (gap > 0) {
			lastCol.setWidth(gap)
		} else {
			lastCol.reinitializeWidth()
		}
	} else {
		if (this.table.options.responsiveLayout && this.table.modExists('responsiveLayout', true)) {
			this.table.modules.responsiveLayout.update()
		}
	}
}
