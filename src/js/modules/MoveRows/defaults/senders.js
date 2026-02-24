/**
 * Default row move sender actions.
 *
 * @type {{delete: function(Object): void}}
 */
export default {
  /**
   * Delete source row after move completes.
   *
   * @param {Object} fromRow Source row.
   */
  delete(fromRow) {
    if (fromRow) {
      fromRow.delete()
    }
  }
}
