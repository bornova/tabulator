/**
 * Parse CSV text into a two-dimensional array.
 *
 * @param {string} input CSV input text.
 * @returns {Array<Array<string>>} Parsed CSV rows.
 */
export default function (input) {
  if (typeof input !== 'string') {
    return []
  }

  const data = []

  let row = 0
  let col = 0
  let inQuote = false

  // Iterate over each character
  for (let index = 0; index < input.length; index++) {
    const char = input[index]
    const nextChar = input[index + 1]
    const rowData = data[row] || (data[row] = [])

    // Initialize empty row
    if (rowData[col] === undefined) {
      rowData[col] = ''
    }

    // Handle quotation mark inside string
    if (char === '"' && inQuote && nextChar === '"') {
      rowData[col] += char
      index++
      continue
    }

    // Begin / End Quote
    if (char === '"') {
      inQuote = !inQuote
      continue
    }

    // Next column (if not in quote)
    if (char === ',' && !inQuote) {
      col++
      continue
    }

    // New row if new line and not in quote (CRLF)
    if (char === '\r' && nextChar === '\n' && !inQuote) {
      col = 0
      row++
      index++
      continue
    }

    // New row if new line and not in quote (CR or LF)
    if ((char === '\r' || char === '\n') && !inQuote) {
      col = 0
      row++
      continue
    }

    // Normal Character, append to column
    rowData[col] += char
  }

  return data
}
