/**
 * Generate CSV file contents from export rows.
 * @param {Array<object>} list Export row list.
 * @param {object} [options={}] Downloader options.
 * @param {string} [options.delimiter] Field delimiter.
 * @param {boolean} [options.bom] Include UTF-8 BOM prefix.
 * @param {Function} setFileContents Callback to receive file payload.
 * @returns {void}
 */
export default function (list, options = {}, setFileContents) {
  const delimiter = options.delimiter || ','
  let fileContents = []
  const headers = []

  list.forEach((row) => {
    const item = []

    switch (row.type) {
      case 'group':
        console.warn('Download Warning - CSV downloader cannot process row groups')
        break

      case 'calc':
        console.warn('Download Warning - CSV downloader cannot process column calculations')
        break

      case 'header':
        row.columns.forEach((col, i) => {
          if (col && col.depth === 1) {
            headers[i] =
              col.value === undefined || col.value === null ? '' : `"${String(col.value).split('"').join('""')}"`
          }
        })
        break

      case 'row':
        row.columns.forEach((col) => {
          if (col) {
            let value = col.value

            switch (typeof value) {
              case 'object':
                value = value !== null ? JSON.stringify(value) : ''
                break

              case 'undefined':
                value = ''
                break
            }

            item.push(`"${String(value).split('"').join('""')}"`)
          }
        })

        fileContents.push(item.join(delimiter))
        break
    }
  })

  if (headers.length) {
    fileContents.unshift(headers.join(delimiter))
  }

  fileContents = fileContents.join('\n')

  if (options.bom) {
    fileContents = `\ufeff${fileContents}`
  }

  setFileContents(fileContents, 'text/csv')
}
