/**
 * Default accessor functions.
 *
 * @type {{rownum: function(*, Object, string, Object, Object, Object): number}}
 */
export default {
  /**
   * Return the row position.
   *
   * @param {*} value Accessor value.
   * @param {Object} data Row data.
   * @param {string} type Access type.
   * @param {Object} params Accessor parameters.
   * @param {Object} column Column instance.
   * @param {Object} row Row instance.
   * @returns {number} Row position.
   */
  rownum(value, data, type, params, column, row) {
    return row.getPosition()
  }
}
