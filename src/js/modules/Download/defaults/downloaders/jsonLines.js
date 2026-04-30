/**
 * Generate NDJSON output from export rows.
 * @param {Array<object>} list Export row list.
 * @param {object} options Downloader options.
 * @param {Function} setFileContents Callback to receive file payload.
 */
export default function (list, options, setFileContents) {
  const fileContents = []
  const typeWarnings = {
    group: false,
    calc: false
  }

  list.forEach((row) => {
    const item = {}

    switch (row.type) {
      case 'header':
        break

      case 'group':
        if (!typeWarnings.group) {
          console.warn('Download Warning - JSON downloader cannot process row groups')
          typeWarnings.group = true
        }
        break

      case 'calc':
        if (!typeWarnings.calc) {
          console.warn('Download Warning - JSON downloader cannot process column calculations')
          typeWarnings.calc = true
        }
        break

      case 'row':
        row.columns.forEach((col) => {
          if (!col) {
            return
          }

          item[col.component.getTitleDownload() || col.component.getField()] = col.value
        })

        fileContents.push(JSON.stringify(item))
        break
    }
  })

  setFileContents(fileContents.join('\n'), 'application/x-ndjson')
}
