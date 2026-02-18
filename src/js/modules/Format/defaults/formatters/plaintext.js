export default function (cell, formatterParams, onRendered) {
  const value = this.sanitizeHTML(cell.getValue())

  return this.emptyToSpace(value)
}
