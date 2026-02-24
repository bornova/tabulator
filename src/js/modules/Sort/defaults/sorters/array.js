import Helpers from '../../../../core/tools/Helpers.js'

// sort if element contains any data
/**
 * Sort array values using configured aggregation.
 *
 * @this {Object}
 * @param {*} a First value.
 * @param {*} b Second value.
 * @param {Object} aRow First row.
 * @param {Object} bRow Second row.
 * @param {Object} column Column definition.
 * @param {string} dir Sort direction.
 * @param {{type?: string, alignEmptyValues?: string, valueMap?: string|function(Array<*>): Array<*>}} params Sort parameters.
 * @returns {number} Sort result.
 */
export default function (a, b, aRow, bRow, column, dir, params) {
  const type = params.type || 'length'
  const alignEmptyValues = params.alignEmptyValues
  let emptyAlign
  const table = this.table
  let valueMap

  if (params.valueMap) {
    if (typeof params.valueMap === 'string') {
      valueMap = (value) =>
        value.map((item) => Helpers.retrieveNestedData(table.options.nestedFieldSeparator, params.valueMap, item))
    } else {
      valueMap = params.valueMap
    }
  }

  const calc = (value) => {
    const mappedValue = valueMap ? valueMap(value) : value

    switch (type) {
      case 'length':
        return mappedValue.length

      case 'sum':
        return mappedValue.reduce((current, next) => current + next, 0)

      case 'max':
        return Math.max.apply(null, mappedValue)

      case 'min':
        return Math.min.apply(null, mappedValue)

      case 'avg':
        return mappedValue.length ? mappedValue.reduce((current, next) => current + next, 0) / mappedValue.length : 0

      case 'string':
        return mappedValue.join('')

      default:
        return mappedValue.length
    }
  }

  // handle non array values
  if (!Array.isArray(a)) {
    emptyAlign = !Array.isArray(b) ? 0 : -1
  } else if (!Array.isArray(b)) {
    emptyAlign = 1
  } else {
    const aValue = calc(a)
    const bValue = calc(b)

    if (type === 'string') {
      const aValueString = String(aValue).toLowerCase()
      const bValueString = String(bValue).toLowerCase()

      return aValueString.localeCompare(bValueString)
    }

    return bValue - aValue
  }

  // fix empty values in position
  if ((alignEmptyValues === 'top' && dir === 'desc') || (alignEmptyValues === 'bottom' && dir === 'asc')) {
    emptyAlign *= -1
  }

  return emptyAlign
}
