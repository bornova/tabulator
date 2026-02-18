/**
 * Return raw HTML cell value.
 *
 * @param {Object} cell Cell component.
 * @param {Object} formatterParams Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {*} Raw cell value.
 */
export default function (cell, formatterParams, onRendered) {
  const value = cell.getValue()

  return value
}
