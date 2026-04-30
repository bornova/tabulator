// sort if element contains any data
/**
 * Sort by value existence.
 *
 * @param {*} a First value.
 * @param {*} b Second value.
 * @returns {number} Sort result.
 */
export default function (a, b) {
  const toSortValue = (value) => (value == null ? 0 : 1)

  const el1 = toSortValue(a)
  const el2 = toSortValue(b)

  return el1 - el2
}
