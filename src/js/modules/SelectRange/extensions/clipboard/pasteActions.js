export default {
  range: function (data) {
    let rows = []
    const range = this.table.modules.selectRange.activeRange
    let singleCell = false
    let bounds
    let startCell
    let startRow
    let rowWidth
    let dataLength

    dataLength = data.length

    if (range) {
      bounds = range.getBounds()
      startCell = bounds.start

      if (bounds.start === bounds.end) {
        singleCell = true
      }

      if (startCell) {
        rows = this.table.rowManager.activeRows.slice()
        startRow = rows.indexOf(startCell.row)

        if (singleCell) {
          rowWidth = data.length
        } else {
          rowWidth = rows.indexOf(bounds.end.row) - startRow + 1
        }

        if (startRow > -1) {
          this.table.blockRedraw()

          rows = rows.slice(startRow, startRow + rowWidth)

          rows.forEach((row, i) => {
            row.updateData(data[i % dataLength])
          })

          this.table.restoreRedraw()
        }
      }
    }

    return rows
  }
}
