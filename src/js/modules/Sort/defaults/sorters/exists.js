// sort if element contains any data
export default function (a, b, aRow, bRow, column, dir, params) {
  const el1 = typeof a === 'undefined' ? 0 : 1
  const el2 = typeof b === 'undefined' ? 0 : 1

  return el1 - el2
}
