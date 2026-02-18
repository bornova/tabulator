// sort if element contains any data
export default function (a, b, aRow, bRow, column, dir, params) {
  const toSortValue = (value) => (typeof value === 'undefined' ? 0 : 1)

  const el1 = toSortValue(a)
  const el2 = toSortValue(b)

  return el1 - el2
}
