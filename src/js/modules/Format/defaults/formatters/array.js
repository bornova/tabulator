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
  formatterParams ??= {}

  const delimiter = formatterParams.delimiter ?? ','
  const table = this.table

  let value = cell.getValue()
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
