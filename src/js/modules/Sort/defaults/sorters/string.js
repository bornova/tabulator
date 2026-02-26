// sort strings
/**
 * Sort string values.
 *
 * @this {Object}
 * @param {*} a First value.
 * @param {*} b Second value.
 * @param {Object} aRow First row.
 * @param {Object} bRow Second row.
 * @param {Object} column Column definition.
 * @param {string} dir Sort direction.
 * @param {{alignEmptyValues?: string, locale?: boolean|string}} params Sort parameters.
 * @returns {number} Sort result.
 */
export default function (a, b, aRow, bRow, column, dir, params) {
  params = params || {}

  const alignEmptyValues = params.alignEmptyValues
  const resolveLocale = () => {
    switch (typeof params.locale) {
      case 'boolean':
        return params.locale ? this.langLocale() : undefined
      case 'string':
        return params.locale
      default:
        return undefined
    }
  }

  let emptyAlign
  let locale

  // handle empty values
  const aEmpty = a == null || a === ''
  const bEmpty = b == null || b === ''

  if (aEmpty) {
    emptyAlign = bEmpty ? 0 : -1
  } else if (bEmpty) {
    emptyAlign = 1
  } else {
    locale = resolveLocale()

    return String(a).toLowerCase().localeCompare(String(b).toLowerCase(), locale)
  }

  // fix empty values in position
  if ((alignEmptyValues === 'top' && dir === 'desc') || (alignEmptyValues === 'bottom' && dir === 'asc')) {
    emptyAlign *= -1
  }

  return emptyAlign
}
