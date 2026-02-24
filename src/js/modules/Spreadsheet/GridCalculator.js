export default class GridCalculator {
  /**
   * @param {number} columns Initial column count.
   * @param {number} rows Initial row count.
   */
  constructor(columns, rows) {
    this.columnCount = columns
    this.rowCount = rows

    this.columnString = []
    this.columns = []
    this.rows = []
  }

  /**
   * Generate spreadsheet column refs (A, B, ...).
   * @param {Array<Array<*>>} data Sheet data.
   * @returns {Array<string>}
   */
  genColumns(data) {
    const maxDataColumns = data.length ? Math.max(...data.map((item) => item.length)) : 0
    const colCount = Math.max(this.columnCount, maxDataColumns)

    this.columnString = []
    this.columns = []

    for (let i = 1; i <= colCount; i++) {
      this.incrementChar(this.columnString.length - 1)
      this.columns.push(this.columnString.join(''))
    }

    return this.columns
  }

  /**
   * Generate spreadsheet row refs.
   * @param {Array<Array<*>>} data Sheet data.
   * @returns {Array<number>}
   */
  genRows(data) {
    const rowCount = Math.max(this.rowCount, data.length)

    this.rows = Array.from({ length: rowCount }, (_value, index) => index + 1)

    return this.rows
  }

  /**
   * Increment alphabetic column token.
   * @param {number} i Token index.
   * @returns {void}
   */
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

  /**
   * Set row count.
   * @param {number} count Row count.
   * @returns {void}
   */
  setRowCount(count) {
    this.rowCount = count
  }

  /**
   * Set column count.
   * @param {number} count Column count.
   * @returns {void}
   */
  setColumnCount(count) {
    this.columnCount = count
  }
}
