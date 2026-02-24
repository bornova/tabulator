/**
 * SelectRange clipboard paste actions.
 *
 * @type {{range: function(Array<object>): Array<object>}}
 */
export default {
  /**
   * Paste data into the currently active range.
   *
   * @this {object}
   * @param {Array<object>} data Parsed clipboard rows.
   * @returns {Array<object>} Rows updated by the paste action.
   */
  range(data) {
    const range = this.table.modules.selectRange.activeRange
    if (!range) {
      return []
    }

    if (!Array.isArray(data) || !data.length) {
      return []
    }

    const bounds = range.getBounds()
    const startCell = bounds.start

    if (!startCell) {
      return []
    }

    const dataLength = data.length
    const allRows = this.table.rowManager.activeRows.slice()
    const startRowIndex = allRows.indexOf(startCell.row)
    const singleCell = bounds.start === bounds.end
    const rowCount = singleCell ? data.length : allRows.indexOf(bounds.end.row) - startRowIndex + 1

    if (startRowIndex > -1) {
      const rows = allRows.slice(startRowIndex, startRowIndex + rowCount)

      this.table.blockRedraw()

      rows.forEach((row, i) => {
        row.updateData(data[i % dataLength])
      })

      this.table.restoreRedraw()

      return rows
    }

    return []
  }
}
