export default function (cell, formatterParams, onRendered) {
	const content = document.createElement('span')
	const row = cell.getRow()
	const table = cell.getTable()

	row.watchPosition((position) => {
		if (formatterParams.relativeToPage) {
			position += table.modules.page.getPageSize() * (table.modules.page.getPage() - 1)
		}
		content.innerText = position
	})

	return content
}
