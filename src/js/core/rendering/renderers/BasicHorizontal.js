import Renderer from '../Renderer.js'

export default class BasicHorizontal extends Renderer {
  renderRowCells(row, inFragment) {
    const rowFrag = document.createDocumentFragment()
    row.cells.forEach((cell) => {
      rowFrag.appendChild(cell.getElement())
    })
    row.element.appendChild(rowFrag)

    if (!inFragment) {
      row.cells.forEach((cell) => {
        cell.cellRendered()
      })
    }
  }

  reinitializeColumnWidths(columns) {
    columns.forEach((column) => {
      column.reinitializeWidth()
    })
  }
}
