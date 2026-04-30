/**
 * Generate JSON output from export rows.
 * @param {Array<object>} list Export row list.
 * @param {object} options Downloader options.
 * @param {Function} setFileContents Callback to receive file payload.
 */
export default function (list, options, setFileContents) {
  const fileContents = []

  list.forEach((row) => {
    const item = {}

    switch (row.type) {
      case 'header':
        break

      case 'group':
        console.warn('Download Warning - JSON downloader cannot process row groups')
        break

      case 'calc':
        console.warn('Download Warning - JSON downloader cannot process column calculations')
        break

      case 'row':
        row.columns.forEach((col) => {
          if (col) {
            item[col.component.getTitleDownload() || col.component.getField()] = col.value
          }
        })

        fileContents.push(item)
        break
    }
  })

  setFileContents(JSON.stringify(fileContents, null, '\t'), 'application/json')
}
