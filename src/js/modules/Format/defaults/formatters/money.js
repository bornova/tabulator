/**
 * Format a numeric value as currency.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {Object} formatterParams Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {string} Formatted currency value.
 */
export default function (cell, formatterParams, onRendered) {
  let floatVal = parseFloat(cell.getValue())
  let sign = ''

  const decimalSym = formatterParams.decimal || '.'
  const thousandSym = formatterParams.thousand || ','
  const negativeSign = formatterParams.negativeSign || '-'
  const symbol = formatterParams.symbol || ''
  const after = !!formatterParams.symbolAfter
  const precision = typeof formatterParams.precision !== 'undefined' ? formatterParams.precision : 2

  if (isNaN(floatVal)) {
    return this.emptyToSpace(this.sanitizeHTML(cell.getValue()))
  }

  if (floatVal < 0) {
    floatVal = Math.abs(floatVal)
    sign = negativeSign
  }

  const number = String(precision !== false ? floatVal.toFixed(precision) : floatVal).split('.')

  let integer = number[0]
  const decimal = number.length > 1 ? `${decimalSym}${number[1]}` : ''

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
