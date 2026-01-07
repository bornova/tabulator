export default function (cell, formatterParams, onRendered) {
	const indent = formatterParams.indent || '\t'
	const multiline = typeof formatterParams.multiline === 'undefined' ? true : formatterParams.multiline
	const replacer = formatterParams.replacer || null
	const value = cell.getValue()

	if (multiline) {
		cell.getElement().style.whiteSpace = 'pre-wrap'
	}

	return JSON.stringify(value, replacer, indent)
}
