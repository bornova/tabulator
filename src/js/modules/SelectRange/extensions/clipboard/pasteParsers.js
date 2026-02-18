export default {
  range(clipboard) {
    const range = this.table.modules.selectRange.activeRange
    if (!range) {
      return false
    }

    const bounds = range.getBounds()
    const startCell = bounds.start

    if (!startCell) {
      return false
    }

    const singleCell = bounds.start === bounds.end
    const data = clipboard.split('\n').map((row) => row.split('\t'))
    const rows = []

    if (!data.length) {
      return false
    }

    const visibleColumns = this.table.columnManager.getVisibleColumnsByIndex()
    const startColumnIndex = visibleColumns.indexOf(startCell.column)

    if (startColumnIndex < 0) {
      return false
    }

    const colWidth = singleCell ? data[0].length : visibleColumns.indexOf(bounds.end.column) - startColumnIndex + 1
    const columnMap = visibleColumns.slice(startColumnIndex, startColumnIndex + colWidth)

    data.forEach((item) => {
      const row = {}
      const itemLength = item.length

      columnMap.forEach((col, i) => {
        row[col.field] = item[i % itemLength]
      })

      rows.push(row)
    })

    return rows
  }
}
