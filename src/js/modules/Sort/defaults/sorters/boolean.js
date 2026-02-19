// sort booleans
/**
 * Sort boolean-like values.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 * @param {Object} aRow First row.
 * @param {Object} bRow Second row.
 * @param {Object} column Column definition.
 * @param {string} dir Sort direction.
 * @param {Object} params Sort parameters.
 * @returns {number} Sort result.
 */
export default function (a, b, aRow, bRow, column, dir, params) {
  void aRow
  void bRow
  void column
  void dir
  void params
  const toSortValue = (value) => (value === true || value === 'true' || value === 'True' || value === 1 ? 1 : 0)

  const el1 = toSortValue(a)
  const el2 = toSortValue(b)

  return el1 - el2
}
