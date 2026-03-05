/**
 * Map a cell value to a display value.
 *
 * @param {Object} cell Cell component.
 * @param {Object<string, *>} formatterParams Lookup map.
 * @returns {*} Lookup result.
 */
export default function (cell, formatterParams) {
  formatterParams ??= {}

  const value = cell.getValue()

  if (!Object.prototype.hasOwnProperty.call(formatterParams, value)) {
    console.warn(`Missing display value for ${value}`)
    return value
  }

  return formatterParams[value]
}
