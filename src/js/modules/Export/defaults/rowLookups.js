/**
 * Default export row lookup functions.
 *
 * @type {{
 *   visible: function(): Array<Object>,
 *   all: function(): Array<Object>,
 *   selected: function(): Array<Object>,
 *   active: function(): Array<Object>
 * }}
 */
export default {
  /**
   * Lookup visible rows.
   *
   * @this {Object}
   * @returns {Array<Object>} Visible rows.
   */
  visible() {
    return this.rowManager.getVisibleRows(false, true)
  },
  /**
   * Lookup all rows.
   *
   * @this {Object}
   * @returns {Array<Object>} All rows.
   */
  all() {
    return this.rowManager.rows
  },
  /**
   * Lookup selected rows.
   *
   * @this {Object}
   * @returns {Array<Object>} Selected rows.
   */
  selected() {
    return this.modules.selectRow ? this.modules.selectRow.selectedRows : []
  },
  /**
   * Lookup active display rows.
   *
   * @this {Object}
   * @returns {Array<Object>} Active rows.
   */
  active() {
    return this.options.pagination
      ? this.rowManager.getDisplayRows(this.rowManager.displayRows.length - 2)
      : this.rowManager.getDisplayRows()
  }
}
