// sort datetime
/**
 * Sort datetime values using luxon.
 *
 * @this {Object}
 * @param {*} a First value.
 * @param {*} b Second value.
 * @param {Object} aRow First row.
 * @param {Object} bRow Second row.
 * @param {Object} column Column definition.
 * @param {string} dir Sort direction.
 * @param {{format?: string, alignEmptyValues?: string}} params Sort parameters.
 * @returns {number} Sort result.
 */
export default function (a, b, aRow, bRow, column, dir, params) {
  const DT = this.table.dependencyRegistry.lookup(['luxon', 'DateTime'], 'DateTime')
  const format = params.format || 'dd/MM/yyyy HH:mm:ss'
  const alignEmptyValues = params.alignEmptyValues
  let emptyAlign

  const parseDateTime = (value) => {
    if (DT.isDateTime(value)) {
      return value
    }

    return format === 'iso' ? DT.fromISO(String(value)) : DT.fromFormat(String(value), format)
  }

  if (typeof DT === 'undefined') {
    console.error("Sort Error - 'datetime' sorter is dependant on luxon.js")

    return String(a).localeCompare(String(b))
  }

  a = parseDateTime(a)
  b = parseDateTime(b)

  if (!a.isValid) {
    emptyAlign = !b.isValid ? 0 : -1
  } else if (!b.isValid) {
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
