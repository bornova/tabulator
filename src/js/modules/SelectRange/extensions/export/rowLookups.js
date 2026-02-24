/**
 * SelectRange export row lookup functions.
 *
 * @type {{range: function(): Array<object>}}
 */
export default {
  /**
   * Resolve selected rows for range export.
   *
   * @this {object}
   * @returns {Array<object>} Selected rows.
   */
  range() {
    return this.modules.selectRange.selectedRows().slice()
  }
}
