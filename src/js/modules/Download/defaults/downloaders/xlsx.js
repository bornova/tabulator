import CoreFeature from '../../../../core/CoreFeature.js'

export default function (list, options, setFileContents) {
	const self = this
	const sheetName = options.sheetName || 'Sheet1'
	const XLSXLib = this.dependencyRegistry.lookup('XLSX')
	let workbook = XLSXLib.utils.book_new()
	const tableFeatures = new CoreFeature(this)
	const compression = 'compress' in options ? options.compress : true
	const writeOptions = options.writeOptions || { bookType: 'xlsx', bookSST: true, compression }
	let output

	writeOptions.type = 'binary'

	workbook.SheetNames = []
	workbook.Sheets = {}

	function generateSheet() {
		const rows = []
		const merges = []
		const worksheet = {}
		const range = {
			s: { c: 0, r: 0 },
			e: { c: list[0] ? list[0].columns.reduce((a, b) => a + (b && b.width ? b.width : 1), 0) : 0, r: list.length }
		}

		// parse row list
		list.forEach((row, i) => {
			const rowData = []

			row.columns.forEach(function (col, j) {
				if (col) {
					rowData.push(
						!(col.value instanceof Date) && typeof col.value === 'object' ? JSON.stringify(col.value) : col.value
					)

					if (col.width > 1 || col.height > -1) {
						if (col.height > 1 || col.width > 1) {
							merges.push({ s: { r: i, c: j }, e: { r: i + col.height - 1, c: j + col.width - 1 } })
						}
					}
				} else {
					rowData.push('')
				}
			})

			rows.push(rowData)
		})

		// convert rows to worksheet
		XLSXLib.utils.sheet_add_aoa(worksheet, rows)

		worksheet['!ref'] = XLSXLib.utils.encode_range(range)

		if (merges.length) {
			worksheet['!merges'] = merges
		}

		return worksheet
	}

	if (options.sheetOnly) {
		setFileContents(generateSheet())
		return
	}

	if (options.sheets) {
		for (var sheet in options.sheets) {
			if (options.sheets[sheet] === true) {
				workbook.SheetNames.push(sheet)
				workbook.Sheets[sheet] = generateSheet()
			} else {
				workbook.SheetNames.push(sheet)

				tableFeatures.commsSend(options.sheets[sheet], 'download', 'intercept', {
					type: 'xlsx',
					options: { sheetOnly: true },
					active: self.active,
					intercept: function (data) {
						workbook.Sheets[sheet] = data
					}
				})
			}
		}
	} else {
		workbook.SheetNames.push(sheetName)
		workbook.Sheets[sheetName] = generateSheet()
	}

	if (options.documentProcessing) {
		workbook = options.documentProcessing(workbook)
	}

	// convert workbook to binary array
	function s2ab(s) {
		const buf = new ArrayBuffer(s.length)
		const view = new Uint8Array(buf)
		for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff
		return buf
	}

	output = XLSXLib.write(workbook, writeOptions)

	setFileContents(s2ab(output), 'application/octet-stream')
}
