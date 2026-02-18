// sort booleans
export default function (a, b, aRow, bRow, column, dir, params) {
  const toSortValue = (value) => (value === true || value === 'true' || value === 'True' || value === 1 ? 1 : 0)

  const el1 = toSortValue(a)
  const el2 = toSortValue(b)

  return el1 - el2
}
