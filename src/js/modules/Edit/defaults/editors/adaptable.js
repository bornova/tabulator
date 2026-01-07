export default function (cell, onRendered, success, cancel, params) {
	const column = cell._getSelf().column
	let lookup
	let editorFunc
	let editorParams

	function defaultLookup(cell) {
		const value = cell.getValue()
		let editor = 'input'

		switch (typeof value) {
			case 'number':
				editor = 'number'
				break

			case 'boolean':
				editor = 'tickCross'
				break

			case 'string':
				if (value.includes('\n')) {
					editor = 'textarea'
				}
				break
		}

		return editor
	}

	lookup = params.editorLookup ? params.editorLookup(cell) : defaultLookup(cell)

	if (params.paramsLookup) {
		editorParams =
			typeof params.paramsLookup === 'function' ? params.paramsLookup(lookup, cell) : params.paramsLookup[lookup]
	}

	editorFunc = this.table.modules.edit.lookupEditor(lookup, column)

	return editorFunc.call(this, cell, onRendered, success, cancel, editorParams || {})
}
