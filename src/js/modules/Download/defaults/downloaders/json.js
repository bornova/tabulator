export default function (list, options, setFileContents) {
  let fileContents = []

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

  fileContents = JSON.stringify(fileContents, null, '\t')

  setFileContents(fileContents, 'application/json')
}
