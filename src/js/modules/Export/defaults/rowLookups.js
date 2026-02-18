export default {
  visible() {
    return this.rowManager.getVisibleRows(false, true)
  },
  all() {
    return this.rowManager.rows
  },
  selected() {
    return this.modules.selectRow.selectedRows
  },
  active() {
    return this.options.pagination
      ? this.rowManager.getDisplayRows(this.rowManager.displayRows.length - 2)
      : this.rowManager.getDisplayRows()
  }
}
