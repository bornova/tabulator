/**
 * Default row move receiver actions.
 *
 * @type {{
 *   insert: function(Object, Object): boolean,
 *   add: function(Object): boolean,
 *   update: function(Object, Object): boolean,
 *   replace: function(Object, Object): boolean
 * }}
 */
export default {
  /**
   * Insert incoming row before a target row.
   *
   * @this {Object}
   * @param {Object} fromRow Source row.
   * @param {Object} toRow Target row.
   * @returns {boolean} True when action succeeds.
   */
  insert(fromRow, toRow) {
    if (!toRow) {
      return false
    }

    this.table.addRow(fromRow.getData(), undefined, toRow)

    return true
  },

  /**
   * Add incoming row to receiving table.
   *
   * @this {Object}
   * @param {Object} fromRow Source row.
   * @returns {boolean} True when action succeeds.
   */
  add(fromRow) {
    this.table.addRow(fromRow.getData())

    return true
  },

  /**
   * Update target row with incoming row data.
   *
   * @param {Object} fromRow Source row.
   * @param {Object} toRow Target row.
   * @returns {boolean} True when update succeeds.
   */
  update(fromRow, toRow) {
    if (!toRow) {
      return false
    }

    toRow.update(fromRow.getData())

    return true
  },

  /**
   * Replace target row with incoming row data.
   *
   * @this {Object}
   * @param {Object} fromRow Source row.
   * @param {Object} toRow Target row.
   * @returns {boolean} True when replace succeeds.
   */
  replace(fromRow, toRow) {
    if (!toRow) {
      return false
    }

    this.table.addRow(fromRow.getData(), undefined, toRow)
    toRow.delete()

    return true
  }
}
