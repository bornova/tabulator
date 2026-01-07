export default function (input) {
  const XLSXLib = this.dependencyRegistry.lookup('XLSX')
  const workbook2 = XLSXLib.read(input)
  const sheet = workbook2.Sheets[workbook2.SheetNames[0]]

  return XLSXLib.utils.sheet_to_json(sheet, { header: 1 })
}
