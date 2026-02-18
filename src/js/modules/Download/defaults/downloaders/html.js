/**
 * Generate HTML output from export rows.
 * @param {Array<object>} list Export row list.
 * @param {object} options Downloader options.
 * @param {Function} setFileContents Callback to receive file payload.
 * @returns {void}
 */
export default function (list, options, setFileContents) {
  if (!this.modExists('export', true)) {
    return
  }

  setFileContents(this.modules.export.generateHTMLTable(list), 'text/html')
}
