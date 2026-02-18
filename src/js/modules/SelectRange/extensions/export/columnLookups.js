/**
 * SelectRange export column lookup functions.
 *
 * @type {{range: function(): Array<object>}}
 */
export default {
  /**
   * Resolve selected columns for range export.
   *
   * @this {object}
   * @returns {Array<object>} Selected columns.
   */
  range() {
    const columns = this.modules.selectRange.selectedColumns()

    if (this.columnManager.rowHeader) {
      columns.unshift(this.columnManager.rowHeader)
    }

    return columns
  }
}
