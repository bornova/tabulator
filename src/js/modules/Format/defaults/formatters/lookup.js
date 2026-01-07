export default function (cell, formatterParams, onRendered) {
  const value = cell.getValue()

  if (typeof formatterParams[value] === 'undefined') {
    console.warn('Missing display value for ' + value)
    return value
  }

  return formatterParams[value]
}
