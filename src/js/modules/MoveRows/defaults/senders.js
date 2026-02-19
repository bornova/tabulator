/**
 * Default row move sender actions.
 *
 * @type {{delete: function(Object, Object, Object): void}}
 */
export default {
  /**
   * Delete source row after move completes.
   *
   * @param {Object} fromRow Source row.
   * @param {Object} toRow Target row.
   * @param {Object} toTable Target table.
   * @returns {void}
   */
  delete(fromRow, toRow, toTable) {
    void toRow
    void toTable
    fromRow.delete()
  }
}
