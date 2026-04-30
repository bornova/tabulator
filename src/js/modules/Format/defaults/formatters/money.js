/**
 * Format a numeric value as currency.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {Object} formatterParams Formatter parameters.
 * @returns {string} Formatted currency value.
 */
export default function (cell, formatterParams) {
  formatterParams ??= {}

  const decimalSym = formatterParams.decimal || '.'
  const thousandSym = formatterParams.thousand || ','
  const negativeSign = formatterParams.negativeSign || '-'
  const symbol = formatterParams.symbol || ''
  const after = !!formatterParams.symbolAfter
  const precision = formatterParams.precision !== undefined ? formatterParams.precision : 2

  let floatVal = parseFloat(cell.getValue())
  let sign = ''

  if (Number.isNaN(floatVal)) {
    return this.emptyToSpace(this.sanitizeHTML(cell.getValue()))
  }

  if (floatVal < 0) {
    floatVal = Math.abs(floatVal)
    sign = negativeSign
  }

  const number = String(precision !== false ? floatVal.toFixed(precision) : floatVal).split('.')
  const decimal = number.length > 1 ? `${decimalSym}${number[1]}` : ''

  let integer = number[0]

  if (formatterParams.thousand !== false) {
    const rgx = /(\d+)(\d{3})/

    while (rgx.test(integer)) {
      integer = integer.replace(rgx, `$1${thousandSym}$2`)
    }
  }

  const value = `${integer}${decimal}`

  if (sign === true) {
    const wrappedValue = `(${value})`

    return after ? `${wrappedValue}${symbol}` : `${symbol}${wrappedValue}`
  } else {
    return after ? `${sign}${value}${symbol}` : `${sign}${symbol}${value}`
  }
}
