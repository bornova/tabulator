// sort booleans
/**
 * Sort boolean-like values.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 * @returns {number} Sort result.
 */
export default function (a, b) {
  const toSortValue = (value) =>
    value === true || value === 'true' || value === 'True' || value === 1 || value === '1' ? 1 : 0

  const el1 = toSortValue(a)
  const el2 = toSortValue(b)

  return el1 - el2
}
