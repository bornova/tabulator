/**
 * Generate PDF output from export rows.
 * @param {Array<object>} list Export row list.
 * @param {object} [options={}] Downloader options.
 * @param {Function} setFileContents Callback to receive file payload.
 * @returns {void}
 */
export default function (list, options = {}, setFileContents) {
  const header = []
  const body = []
  let autoTableParams = {}
  const rowGroupStyles = options.rowGroupStyles || {
    fontStyle: 'bold',
    fontSize: 12,
    cellPadding: 6,
    fillColor: 220
  }
  const rowCalcStyles = options.rowCalcStyles || {
    fontStyle: 'bold',
    fontSize: 10,
    cellPadding: 4,
    fillColor: 232
  }
  const jsPDFParams = options.jsPDF || {}
  const title = options.title || ''
  let jspdfLib
  let doc

  jsPDFParams.orientation ||= options.orientation || 'landscape'
  jsPDFParams.unit ||= 'pt'

  // parse row list
  list.forEach((row) => {
    switch (row.type) {
      case 'header':
        header.push(parseRow(row))
        break

      case 'group':
        body.push(parseRow(row, rowGroupStyles))
        break

      case 'calc':
        body.push(parseRow(row, rowCalcStyles))
        break

      case 'row':
        body.push(parseRow(row))
        break
    }
  })

  /**
   * Convert an export row into jsPDF autoTable row cells.
   * @param {object} row Export row.
   * @param {object} [styles] Cell style override.
   * @returns {Array<object>}
   */
  function parseRow(row, styles) {
    const rowData = []

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

        const cell = {
          content: value,
          colSpan: col.width,
          rowSpan: col.height
        }

        if (styles) {
          cell.styles = styles
        }

        rowData.push(cell)
      }
    })

    return rowData
  }

  // configure PDF
  jspdfLib = this.dependencyRegistry.lookup('jspdf', 'jsPDF')
  doc = new jspdfLib(jsPDFParams) // set document to landscape, better for most tables

  if (options.autoTable) {
    if (typeof options.autoTable === 'function') {
      autoTableParams = options.autoTable(doc) || {}
    } else {
      autoTableParams = options.autoTable
    }
  }

  if (title) {
    autoTableParams.didDrawPage = function () {
      doc.text(title, 40, 30)
    }
  }

  autoTableParams.head = header
  autoTableParams.body = body

  doc.autoTable(autoTableParams)

  if (options.documentProcessing) {
    options.documentProcessing(doc)
  }

  setFileContents(doc.output('arraybuffer'), 'application/pdf')
}
