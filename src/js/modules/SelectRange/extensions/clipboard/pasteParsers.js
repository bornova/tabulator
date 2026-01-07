export default {
  range: function (clipboard) {
    const data = []
    const rows = []
    const range = this.table.modules.selectRange.activeRange
    let singleCell = false
    let bounds
    let startCell
    let colWidth
    let columnMap
    let startCol

    if (range) {
      bounds = range.getBounds()
      startCell = bounds.start

      if (bounds.start === bounds.end) {
        singleCell = true
      }

      if (startCell) {
        // get data from clipboard into array of columns and rows.
        clipboard = clipboard.split('\n')

        clipboard.forEach(function (row) {
          data.push(row.split('\t'))
        })

        if (data.length) {
          columnMap = this.table.columnManager.getVisibleColumnsByIndex()
          startCol = columnMap.indexOf(startCell.column)

          if (startCol > -1) {
            if (singleCell) {
              colWidth = data[0].length
            } else {
              colWidth = columnMap.indexOf(bounds.end.column) - startCol + 1
            }

            columnMap = columnMap.slice(startCol, startCol + colWidth)

            data.forEach((item) => {
              const row = {}
              const itemLength = item.length

              columnMap.forEach(function (col, i) {
                row[col.field] = item[i % itemLength]
              })

              rows.push(row)
            })

            return rows
          }
        }
      }
    }

    return false
  }
}
