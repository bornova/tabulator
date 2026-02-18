export default function (cell, formatterParams, onRendered) {
  const indent = formatterParams.indent || '\t'
  const multiline = typeof formatterParams.multiline === 'undefined' ? true : formatterParams.multiline
  const replacer = formatterParams.replacer || null
  const value = cell.getValue()
  const element = cell.getElement()

  if (multiline) {
    element.style.whiteSpace = 'pre-wrap'
  }

  return JSON.stringify(value, replacer, indent)
}
