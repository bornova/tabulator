export default function (cell, formatterParams, onRendered) {
  const element = cell.getElement()

  element.style.whiteSpace = 'pre-wrap'
  return this.emptyToSpace(this.sanitizeHTML(cell.getValue()))
}
