export default function (cell, formatterParams, onRendered) {
  const element = cell.getElement()
  const color = this.sanitizeHTML(cell.getValue())

  element.style.backgroundColor = color
  return ''
}
