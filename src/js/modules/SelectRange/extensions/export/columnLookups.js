export default {
	range: function () {
		const columns = this.modules.selectRange.selectedColumns()

		if (this.columnManager.rowHeader) {
			columns.unshift(this.columnManager.rowHeader)
		}

		return columns
	}
}
