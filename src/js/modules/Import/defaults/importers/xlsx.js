/**
 * Parse XLSX input into a two-dimensional array.
 *
 * @this {Object}
 * @param {*} input XLSX input payload.
 * @returns {Array<Array<*>>} Parsed worksheet rows.
 */
export default function (input) {
  const xlsxLib = this.dependencyRegistry.lookup('XLSX')

  if (!xlsxLib) {
    throw new Error('Import Error - XLSX dependency not found')
  }

  const workbook = xlsxLib.read(input)
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]

  return xlsxLib.utils.sheet_to_json(sheet, { header: 1 })
}
