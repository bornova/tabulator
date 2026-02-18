export default class GridCalculator {
  constructor(columns, rows) {
    this.columnCount = columns
    this.rowCount = rows

    this.columnString = []
    this.columns = []
    this.rows = []
  }

  genColumns(data) {
    const maxDataColumns = Math.max(...data.map((item) => item.length))
    const colCount = Math.max(this.columnCount, maxDataColumns)

    this.columnString = []
    this.columns = []

    for (let i = 1; i <= colCount; i++) {
      this.incrementChar(this.columnString.length - 1)
      this.columns.push(this.columnString.join(''))
    }

    return this.columns
  }

  genRows(data) {
    const rowCount = Math.max(this.rowCount, data.length)

    this.rows = Array.from({ length: rowCount }, (_value, index) => index + 1)

    return this.rows
  }

  incrementChar(i) {
    const currentChar = this.columnString[i]

    if (!currentChar) {
      this.columnString.push('A')
      return
    }

    if (currentChar !== 'Z') {
      this.columnString[i] = String.fromCharCode(currentChar.charCodeAt(0) + 1)
      return
    }

    this.columnString[i] = 'A'

    if (i > 0) {
      this.incrementChar(i - 1)
    } else {
      this.columnString.push('A')
    }
  }

  setRowCount(count) {
    this.rowCount = count
  }

  setColumnCount(count) {
    this.columnCount = count
  }
}
