import Helpers from '../../../../core/tools/Helpers.js'

/**
 * Format array values by joining mapped items.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {{delimiter?: string, valueMap?: string|function(Array<*>): Array<*>}} formatterParams Formatter parameters.
 * @returns {*} Formatted value.
 */
export default function (cell, formatterParams) {
  const delimiter = formatterParams.delimiter ?? ','
  let value = cell.getValue()
  const table = this.table
  let valueMap

  if (formatterParams.valueMap) {
    if (typeof formatterParams.valueMap === 'string') {
      valueMap = (mappedValue) =>
        mappedValue.map((item) =>
          Helpers.retrieveNestedData(table.options.nestedFieldSeparator, formatterParams.valueMap, item)
        )
    } else {
      valueMap = formatterParams.valueMap
    }
  }

  if (Array.isArray(value)) {
    if (valueMap) {
      value = valueMap(value)
    }

    return value.join(delimiter)
  }

  return value
}
