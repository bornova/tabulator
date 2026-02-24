import datetime from './datetime.js'

// sort date
/**
 * Sort date values via the datetime sorter.
 *
 * @this {Object}
 * @param {*} a First value.
 * @param {*} b Second value.
 * @param {Object} aRow First row.
 * @param {Object} bRow Second row.
 * @param {Object} column Column definition.
 * @param {string} dir Sort direction.
 * @param {{format?: string}} params Sort parameters.
 * @returns {number} Sort result.
 */
export default function (a, b, aRow, bRow, column, dir, params) {
  const sorterParams = {
    ...(params || {}),
    format: (params && params.format) || 'dd/MM/yyyy'
  }

  return datetime.call(this, a, b, aRow, bRow, column, dir, sorterParams)
}
