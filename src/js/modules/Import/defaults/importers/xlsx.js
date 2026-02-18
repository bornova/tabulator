export default function (input) {
  const xlsxLib = this.dependencyRegistry.lookup('XLSX')
  const workbook = xlsxLib.read(input)
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]

  return xlsxLib.utils.sheet_to_json(sheet, { header: 1 })
}
