// sort numbers
export default function (a, b, aRow, bRow, column, dir, params) {
  const alignEmptyValues = params.alignEmptyValues
  const decimal = params.decimalSeparator
  const thousand = params.thousandSeparator
  let emptyAlign = 0

  const normalizeNumber = (value) => {
    let normalized = String(value)

    if (thousand) {
      normalized = normalized.split(thousand).join('')
    }

    if (decimal) {
      normalized = normalized.split(decimal).join('.')
    }

    return parseFloat(normalized)
  }

  a = normalizeNumber(a)
  b = normalizeNumber(b)

  // handle non numeric values
  if (isNaN(a)) {
    emptyAlign = isNaN(b) ? 0 : -1
  } else if (isNaN(b)) {
    emptyAlign = 1
  } else {
    // compare valid values
    return a - b
  }

  // fix empty values in position
  if ((alignEmptyValues === 'top' && dir === 'desc') || (alignEmptyValues === 'bottom' && dir === 'asc')) {
    emptyAlign *= -1
  }

  return emptyAlign
}
