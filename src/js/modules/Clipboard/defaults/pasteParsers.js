/**
 * Default clipboard paste parsers.
 *
 * @type {{table: function(string): Array<Object>|boolean}}
 */
export default {
  /**
   * Parse tabular clipboard text into row objects.
   *
   * @this {Object}
   * @param {string} clipboard Clipboard text.
   * @returns {Array<Object>|boolean} Parsed rows or false if clipboard content is invalid.
   */
  table(clipboard) {
    const data = []
    const columns = this.table.columnManager.columns
    const rows = []

    let headerFindSuccess = true
    let columnMap = []

    // get data from clipboard into array of columns and rows.
    clipboard = clipboard.split('\n')

    clipboard.forEach((row) => {
      data.push(row.split('\t'))
    })

    if (data.length && !(data.length === 1 && data[0].length < 2)) {
      // check if headers are present by title
      data[0].forEach((value) => {
        const column = columns.find(
          (column) =>
            value && column.definition.title && value.trim() && column.definition.title.trim() === value.trim()
        )

        if (column) {
          columnMap.push(column)
        } else {
          headerFindSuccess = false
        }
      })

      // check if column headers are present by field
      if (!headerFindSuccess) {
        headerFindSuccess = true
        columnMap = []

        data[0].forEach((value) => {
          const column = columns.find(
            (column) => value && column.field && value.trim() && column.field.trim() === value.trim()
          )

          if (column) {
            columnMap.push(column)
          } else {
            headerFindSuccess = false
          }
        })

        if (!headerFindSuccess) {
          columnMap = this.table.columnManager.columnsByIndex
        }
      }

      // remove header row if found
      if (headerFindSuccess) {
        data.shift()
      }

      data.forEach((item) => {
        if (item.length === 1 && item[0] === '') {
          return
        }

        const row = {}

        item.forEach((value, i) => {
          if (columnMap[i]) {
            row[columnMap[i].field] = value
          }
        })

        rows.push(row)
      })

      return rows
    }

    return false
  }
}
