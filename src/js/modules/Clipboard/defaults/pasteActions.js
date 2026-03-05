/**
 * Default clipboard paste actions.
 *
 * @type {{
 *   replace: function(Array<Object>): Promise<*>,
 *   update: function(Array<Object>): Promise<*>,
 *   insert: function(Array<Object>): Promise<*>
 * }}
 */
export default {
  /**
   * Replace table data with pasted rows.
   *
   * @this {Object}
   * @param {Array<Object>} data Parsed clipboard data.
   * @returns {Promise<*>} Data load promise.
   */
  replace(data) {
    return this.table.setData(data)
  },
  /**
   * Update or add rows from pasted data.
   *
   * @this {Object}
   * @param {Array<Object>} data Parsed clipboard data.
   * @returns {Promise<*>} Update promise.
   */
  update(data) {
    return this.table.updateOrAddData(data)
  },
  /**
   * Insert pasted rows into the table.
   *
   * @this {Object}
   * @param {Array<Object>} data Parsed clipboard data.
   * @returns {Promise<*>} Insert promise.
   */
  insert(data) {
    return this.table.addData(data)
  }
}
