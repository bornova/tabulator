import Helpers from '../../../../core/tools/Helpers.js'

export default function (cell, formatterParams, onRendered) {
	let value = cell.getValue()
	const urlPrefix = formatterParams.urlPrefix || ''
	let download = formatterParams.download
	let label = value
	const el = document.createElement('a')
	let data

	function labelTraverse(path, data) {
		const item = path.shift()
		const value = data[item]

		if (path.length && typeof value === 'object') {
			return labelTraverse(path, value)
		}

		return value
	}

	if (formatterParams.labelField) {
		data = cell.getData()
		label = labelTraverse(formatterParams.labelField.split(this.table.options.nestedFieldSeparator), data)
	}

	if (formatterParams.label) {
		switch (typeof formatterParams.label) {
			case 'string':
				label = formatterParams.label
				break

			case 'function':
				label = formatterParams.label(cell)
				break
		}
	}

	if (label) {
		if (formatterParams.urlField) {
			data = cell.getData()

			value = Helpers.retrieveNestedData(this.table.options.nestedFieldSeparator, formatterParams.urlField, data)
		}

		if (formatterParams.url) {
			switch (typeof formatterParams.url) {
				case 'string':
					value = formatterParams.url
					break

				case 'function':
					value = formatterParams.url(cell)
					break
			}
		}

		el.setAttribute('href', urlPrefix + value)

		if (formatterParams.target) {
			el.setAttribute('target', formatterParams.target)
		}

		if (formatterParams.download) {
			if (typeof download === 'function') {
				download = download(cell)
			} else {
				download = download === true ? '' : download
			}

			el.setAttribute('download', download)
		}

		el.innerHTML = this.emptyToSpace(this.sanitizeHTML(label))

		return el
	} else {
		return '&nbsp;'
	}
}
