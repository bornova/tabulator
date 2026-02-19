/**
 * Map a cell value to a display value.
 *
 * @param {Object} cell Cell component.
 * @param {Object<string, *>} formatterParams Lookup map.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {*} Lookup result.
 */
export default function (cell, formatterParams, onRendered) {
  void onRendered
  const value = cell.getValue()

  if (typeof formatterParams[value] === 'undefined') {
    console.warn(`Missing display value for ${value}`)
    return value
  }

  return formatterParams[value]
}
