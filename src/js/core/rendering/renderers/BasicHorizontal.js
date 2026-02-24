import Renderer from '../Renderer.js'

export default class BasicHorizontal extends Renderer {
  /**
   * Render all cells for a row into the row element.
   * @param {object} row Internal row instance.
   * @param {boolean} [inFragment] True when rendering inside a detached fragment.
   */
  renderRowCells(row, inFragment) {
    const rowFrag = document.createDocumentFragment()
    row.cells.forEach((cell) => {
      rowFrag.appendChild(cell.getElement())
    })
    row.element.appendChild(rowFrag)

    if (inFragment) {
      return
    }

    row.cells.forEach((cell) => {
      cell.cellRendered()
    })
  }

  /**
   * Reinitialize widths for a set of columns.
   * @param {Array<object>} columns Internal column instances.
   */
  reinitializeColumnWidths(columns) {
    columns.forEach((column) => {
      column.reinitializeWidth()
    })
  }
}
