export default function (list, options, setFileContents) {
  if (!this.modExists('export', true)) {
    return
  }

  setFileContents(this.modules.export.generateHTMLTable(list), 'text/html')
}
