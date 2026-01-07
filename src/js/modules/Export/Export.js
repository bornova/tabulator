import Module from '../../core/Module.js'

import ExportRow from './ExportRow.js'
import ExportColumn from './ExportColumn.js'

import columnLookups from './defaults/columnLookups.js'
import rowLookups from './defaults/rowLookups.js'

export default class Export extends Module {
	static moduleName = 'export'

	static columnLookups = columnLookups
	static rowLookups = rowLookups

	constructor(table) {
		super(table)

		this.config = {}
		this.cloneTableStyle = true
		this.colVisProp = ''
		this.colVisPropAttach = ''

		this.registerTableOption('htmlOutputConfig', false) // html output config

		this.registerColumnOption('htmlOutput')
		this.registerColumnOption('titleHtmlOutput')
	}

	initialize() {
		this.registerTableFunction('getHtml', this.getHtml.bind(this))
	}

	/// ////////////////////////////////
	/// ////// Internal Logic //////////
	/// ////////////////////////////////

	generateExportList(config, style, range, colVisProp) {
		let headers, body, columns, colLookup

		this.cloneTableStyle = style
		this.config = config || {}
		this.colVisProp = colVisProp
		this.colVisPropAttach = this.colVisProp.charAt(0).toUpperCase() + this.colVisProp.slice(1)

		colLookup = Export.columnLookups[range]

		if (colLookup) {
			columns = colLookup.call(this.table)
			columns = columns.filter((col) => this.columnVisCheck(col))
		}

		headers =
			this.config.columnHeaders !== false ? this.headersToExportRows(this.generateColumnGroupHeaders(columns)) : []

		if (columns) {
			columns = columns.map((col) => col.getComponent())
		}

		body = this.bodyToExportRows(this.rowLookup(range), columns)

		return headers.concat(body)
	}

	generateTable(config, style, range, colVisProp) {
		const list = this.generateExportList(config, style, range, colVisProp)

		return this.generateTableElement(list)
	}

	rowLookup(range) {
		let rows = []
		let rowLookup

		if (typeof range === 'function') {
			range.call(this.table).forEach((row) => {
				row = this.table.rowManager.findRow(row)

				if (row) {
					rows.push(row)
				}
			})
		} else {
			rowLookup = Export.rowLookups[range] || Export.rowLookups.active

			rows = rowLookup.call(this.table)
		}

		return Object.assign([], rows)
	}

	generateColumnGroupHeaders(columns) {
		const output = []

		if (!columns) {
			columns =
				this.config.columnGroups !== false ? this.table.columnManager.columns : this.table.columnManager.columnsByIndex
		}

		columns.forEach((column) => {
			const colData = this.processColumnGroup(column)

			if (colData) {
				output.push(colData)
			}
		})

		return output
	}

	processColumnGroup(column) {
		const subGroups = column.columns
		let maxDepth = 0
		const title = column.definition['title' + this.colVisPropAttach] || column.definition.title

		const groupData = {
			title,
			column,
			depth: 1
		}

		if (subGroups.length) {
			groupData.subGroups = []
			groupData.width = 0

			subGroups.forEach((subGroup) => {
				const subGroupData = this.processColumnGroup(subGroup)

				if (subGroupData) {
					groupData.width += subGroupData.width
					groupData.subGroups.push(subGroupData)

					if (subGroupData.depth > maxDepth) {
						maxDepth = subGroupData.depth
					}
				}
			})

			groupData.depth += maxDepth

			if (!groupData.width) {
				return false
			}
		} else {
			if (this.columnVisCheck(column)) {
				groupData.width = 1
			} else {
				return false
			}
		}

		return groupData
	}

	columnVisCheck(column) {
		let visProp = column.definition[this.colVisProp]

		if (this.config.rowHeaders === false && column.isRowHeader) {
			return false
		}

		if (typeof visProp === 'function') {
			visProp = visProp.call(this.table, column.getComponent())
		}

		if (visProp === false || visProp === true) {
			return visProp
		}

		return column.visible && column.field
	}

	headersToExportRows(columns) {
		const headers = []
		let headerDepth = 0
		const exportRows = []

		function parseColumnGroup(column, level) {
			const depth = headerDepth - level

			if (typeof headers[level] === 'undefined') {
				headers[level] = []
			}

			column.height = column.subGroups ? 1 : depth - column.depth + 1

			headers[level].push(column)

			if (column.height > 1) {
				for (let i = 1; i < column.height; i++) {
					if (typeof headers[level + i] === 'undefined') {
						headers[level + i] = []
					}

					headers[level + i].push(false)
				}
			}

			if (column.width > 1) {
				for (let i = 1; i < column.width; i++) {
					headers[level].push(false)
				}
			}

			if (column.subGroups) {
				column.subGroups.forEach(function (subGroup) {
					parseColumnGroup(subGroup, level + 1)
				})
			}
		}

		// calculate maximum header depth
		columns.forEach(function (column) {
			if (column.depth > headerDepth) {
				headerDepth = column.depth
			}
		})

		columns.forEach(function (column) {
			parseColumnGroup(column, 0)
		})

		headers.forEach((header) => {
			const columns = []

			header.forEach((col) => {
				if (col) {
					const title = typeof col.title === 'undefined' ? '' : col.title
					columns.push(new ExportColumn(title, col.column.getComponent(), col.width, col.height, col.depth))
				} else {
					columns.push(null)
				}
			})

			exportRows.push(new ExportRow('header', columns))
		})

		return exportRows
	}

	bodyToExportRows(rows, columns = []) {
		const exportRows = []

		if (columns.length === 0) {
			this.table.columnManager.columnsByIndex.forEach((column) => {
				if (this.columnVisCheck(column)) {
					columns.push(column.getComponent())
				}
			})
		}

		if (this.config.columnCalcs !== false && this.table.modExists('columnCalcs')) {
			if (this.table.modules.columnCalcs.topInitialized) {
				rows.unshift(this.table.modules.columnCalcs.topRow)
			}

			if (this.table.modules.columnCalcs.botInitialized) {
				rows.push(this.table.modules.columnCalcs.botRow)
			}
		}

		rows = rows.filter((row) => {
			switch (row.type) {
				case 'group':
					return this.config.rowGroups !== false

				case 'calc':
					return this.config.columnCalcs !== false

				case 'row':
					return !(this.table.options.dataTree && this.config.dataTree === false && row.modules.dataTree.parent)
			}

			return true
		})

		rows.forEach((row, i) => {
			const rowData = row.getData(this.colVisProp)
			const exportCols = []
			let indent = 0

			switch (row.type) {
				case 'group':
					indent = row.level
					exportCols.push(new ExportColumn(row.key, row.getComponent(), columns.length, 1))
					break

				case 'calc':
				case 'row':
					columns.forEach((col) => {
						exportCols.push(new ExportColumn(col._column.getFieldValue(rowData), col, 1, 1))
					})

					if (this.table.options.dataTree && this.config.dataTree !== false) {
						indent = row.modules.dataTree.index
					}
					break
			}

			exportRows.push(new ExportRow(row.type, exportCols, row.getComponent(), indent))
		})

		return exportRows
	}

	generateTableElement(list) {
		const table = document.createElement('table')
		const headerEl = document.createElement('thead')
		const bodyEl = document.createElement('tbody')
		const styles = this.lookupTableStyles()
		const rowFormatter = this.table.options['rowFormatter' + this.colVisPropAttach]
		const setup = {}

		setup.rowFormatter = rowFormatter !== null ? rowFormatter : this.table.options.rowFormatter

		if (this.table.options.dataTree && this.config.dataTree !== false && this.table.modExists('columnCalcs')) {
			setup.treeElementField = this.table.modules.dataTree.elementField
		}

		// assign group header formatter
		setup.groupHeader = this.table.options['groupHeader' + this.colVisPropAttach]

		if (setup.groupHeader && !Array.isArray(setup.groupHeader)) {
			setup.groupHeader = [setup.groupHeader]
		}

		table.classList.add('tabulator-print-table')

		this.mapElementStyles(this.table.columnManager.getHeadersElement(), headerEl, [
			'border-top',
			'border-left',
			'border-right',
			'border-bottom',
			'background-color',
			'color',
			'font-weight',
			'font-family',
			'font-size'
		])

		if (list.length > 1000) {
			console.warn('It may take a long time to render an HTML table with more than 1000 rows')
		}

		list.forEach((row, i) => {
			let rowEl

			switch (row.type) {
				case 'header':
					headerEl.appendChild(this.generateHeaderElement(row, setup, styles))
					break

				case 'group':
					bodyEl.appendChild(this.generateGroupElement(row, setup, styles))
					break

				case 'calc':
					bodyEl.appendChild(this.generateCalcElement(row, setup, styles))
					break

				case 'row':
					rowEl = this.generateRowElement(row, setup, styles)

					this.mapElementStyles(i % 2 && styles.evenRow ? styles.evenRow : styles.oddRow, rowEl, [
						'border-top',
						'border-left',
						'border-right',
						'border-bottom',
						'color',
						'font-weight',
						'font-family',
						'font-size',
						'background-color'
					])
					bodyEl.appendChild(rowEl)
					break
			}
		})

		if (headerEl.innerHTML) {
			table.appendChild(headerEl)
		}

		table.appendChild(bodyEl)

		this.mapElementStyles(this.table.element, table, ['border-top', 'border-left', 'border-right', 'border-bottom'])
		return table
	}

	lookupTableStyles() {
		const styles = {}

		// lookup row styles
		if (this.cloneTableStyle && window.getComputedStyle) {
			styles.oddRow = this.table.element.querySelector('.tabulator-row-odd:not(.tabulator-group):not(.tabulator-calcs)')
			styles.evenRow = this.table.element.querySelector(
				'.tabulator-row-even:not(.tabulator-group):not(.tabulator-calcs)'
			)
			styles.calcRow = this.table.element.querySelector('.tabulator-row.tabulator-calcs')
			styles.firstRow = this.table.element.querySelector('.tabulator-row:not(.tabulator-group):not(.tabulator-calcs)')
			styles.firstGroup = this.table.element.getElementsByClassName('tabulator-group')[0]

			if (styles.firstRow) {
				styles.styleCells = styles.firstRow.getElementsByClassName('tabulator-cell')
				styles.styleRowHeader = styles.firstRow.getElementsByClassName('tabulator-row-header')[0]
				styles.firstCell = styles.styleCells[0]
				styles.lastCell = styles.styleCells[styles.styleCells.length - 1]
			}
		}

		return styles
	}

	generateHeaderElement(row, setup, styles) {
		const rowEl = document.createElement('tr')

		row.columns.forEach((column) => {
			if (column) {
				const cellEl = document.createElement('th')
				const classNames = column.component._column.definition.cssClass
					? column.component._column.definition.cssClass.split(' ')
					: []

				cellEl.colSpan = column.width
				cellEl.rowSpan = column.height

				cellEl.innerHTML = column.value

				if (this.cloneTableStyle) {
					cellEl.style.boxSizing = 'border-box'
				}

				classNames.forEach(function (className) {
					cellEl.classList.add(className)
				})

				this.mapElementStyles(column.component.getElement(), cellEl, [
					'text-align',
					'border-left',
					'border-right',
					'background-color',
					'color',
					'font-weight',
					'font-family',
					'font-size'
				])
				this.mapElementStyles(column.component._column.contentElement, cellEl, [
					'padding-top',
					'padding-left',
					'padding-right',
					'padding-bottom'
				])

				if (column.component._column.visible) {
					this.mapElementStyles(column.component.getElement(), cellEl, ['width'])
				} else {
					if (column.component._column.definition.width) {
						cellEl.style.width = column.component._column.definition.width + 'px'
					}
				}

				if (column.component._column.parent && column.component._column.parent.isGroup) {
					this.mapElementStyles(column.component._column.parent.groupElement, cellEl, ['border-top'])
				} else {
					this.mapElementStyles(column.component.getElement(), cellEl, ['border-top'])
				}

				if (column.component._column.isGroup) {
					this.mapElementStyles(column.component.getElement(), cellEl, ['border-bottom'])
				} else {
					this.mapElementStyles(this.table.columnManager.getElement(), cellEl, ['border-bottom'])
				}

				rowEl.appendChild(cellEl)
			}
		})

		return rowEl
	}

	generateGroupElement(row, setup, styles) {
		const rowEl = document.createElement('tr')
		const cellEl = document.createElement('td')
		const group = row.columns[0]

		rowEl.classList.add('tabulator-print-table-row')

		if (setup.groupHeader && setup.groupHeader[row.indent]) {
			group.value = setup.groupHeader[row.indent](
				group.value,
				row.component._group.getRowCount(),
				row.component._group.getData(),
				row.component
			)
		} else {
			if (setup.groupHeader !== false) {
				group.value = row.component._group.generator(
					group.value,
					row.component._group.getRowCount(),
					row.component._group.getData(),
					row.component
				)
			}
		}

		cellEl.colSpan = group.width
		cellEl.innerHTML = group.value

		rowEl.classList.add('tabulator-print-table-group')
		rowEl.classList.add('tabulator-group-level-' + row.indent)

		if (group.component.isVisible()) {
			rowEl.classList.add('tabulator-group-visible')
		}

		this.mapElementStyles(styles.firstGroup, rowEl, [
			'border-top',
			'border-left',
			'border-right',
			'border-bottom',
			'color',
			'font-weight',
			'font-family',
			'font-size',
			'background-color'
		])
		this.mapElementStyles(styles.firstGroup, cellEl, ['padding-top', 'padding-left', 'padding-right', 'padding-bottom'])

		rowEl.appendChild(cellEl)

		return rowEl
	}

	generateCalcElement(row, setup, styles) {
		const rowEl = this.generateRowElement(row, setup, styles)

		rowEl.classList.add('tabulator-print-table-calcs')
		this.mapElementStyles(styles.calcRow, rowEl, [
			'border-top',
			'border-left',
			'border-right',
			'border-bottom',
			'color',
			'font-weight',
			'font-family',
			'font-size',
			'background-color'
		])

		return rowEl
	}

	generateRowElement(row, setup, styles) {
		const rowEl = document.createElement('tr')

		rowEl.classList.add('tabulator-print-table-row')

		row.columns.forEach((col, i) => {
			if (col) {
				const cellEl = document.createElement('td')
				const column = col.component._column
				const table = this.table
				const index = table.columnManager.findColumnIndex(column)
				let value = col.value
				let cellStyle
				let styleProps

				var cellWrapper = {
					modules: {},
					getValue: function () {
						return value
					},
					getField: function () {
						return column.definition.field
					},
					getElement: function () {
						return cellEl
					},
					getType: function () {
						return 'cell'
					},
					getColumn: function () {
						return column.getComponent()
					},
					getData: function () {
						return row.component.getData()
					},
					getRow: function () {
						return row.component
					},
					getTable: function () {
						return table
					},
					getComponent: function () {
						return cellWrapper
					},
					column
				}

				const classNames = column.definition.cssClass ? column.definition.cssClass.split(' ') : []

				classNames.forEach(function (className) {
					cellEl.classList.add(className)
				})

				if (this.table.modExists('format') && this.config.formatCells !== false) {
					value = this.table.modules.format.formatExportValue(cellWrapper, this.colVisProp)
				} else {
					switch (typeof value) {
						case 'object':
							value = value !== null ? JSON.stringify(value) : ''
							break

						case 'undefined':
							value = ''
							break
					}
				}

				if (value instanceof Node) {
					cellEl.appendChild(value)
				} else {
					cellEl.innerHTML = value
				}

				styleProps = [
					'padding-top',
					'padding-left',
					'padding-right',
					'padding-bottom',
					'border-top',
					'border-left',
					'border-right',
					'border-bottom',
					'color',
					'font-weight',
					'font-family',
					'font-size',
					'text-align'
				]

				if (column.isRowHeader) {
					cellStyle = styles.styleRowHeader
					styleProps.push('background-color')
				} else {
					cellStyle = styles.styleCells && styles.styleCells[index] ? styles.styleCells[index] : styles.firstCell
				}

				if (cellStyle) {
					this.mapElementStyles(cellStyle, cellEl, styleProps)

					if (column.definition.align) {
						cellEl.style.textAlign = column.definition.align
					}
				}

				if (this.table.options.dataTree && this.config.dataTree !== false) {
					if (
						(setup.treeElementField && setup.treeElementField == column.field) ||
						(!setup.treeElementField && i == 0)
					) {
						if (row.component._row.modules.dataTree.controlEl) {
							cellEl.insertBefore(row.component._row.modules.dataTree.controlEl.cloneNode(true), cellEl.firstChild)
						}
						if (row.component._row.modules.dataTree.branchEl) {
							cellEl.insertBefore(row.component._row.modules.dataTree.branchEl.cloneNode(true), cellEl.firstChild)
						}
					}
				}

				rowEl.appendChild(cellEl)

				if (cellWrapper.modules.format && cellWrapper.modules.format.renderedCallback) {
					cellWrapper.modules.format.renderedCallback()
				}
			}
		})

		if (setup.rowFormatter && row.type === 'row' && this.config.formatCells !== false) {
			const formatComponent = Object.assign(row.component)

			formatComponent.getElement = function () {
				return rowEl
			}

			setup.rowFormatter(row.component)
		}

		return rowEl
	}

	generateHTMLTable(list) {
		const holder = document.createElement('div')

		holder.appendChild(this.generateTableElement(list))

		return holder.innerHTML
	}

	getHtml(visible, style, config, colVisProp) {
		const list = this.generateExportList(
			config || this.table.options.htmlOutputConfig,
			style,
			visible,
			colVisProp || 'htmlOutput'
		)

		return this.generateHTMLTable(list)
	}

	mapElementStyles(from, to, props) {
		if (this.cloneTableStyle && from && to) {
			const lookup = {
				'background-color': 'backgroundColor',
				color: 'fontColor',
				width: 'width',
				'font-weight': 'fontWeight',
				'font-family': 'fontFamily',
				'font-size': 'fontSize',
				'text-align': 'textAlign',
				'border-top': 'borderTop',
				'border-left': 'borderLeft',
				'border-right': 'borderRight',
				'border-bottom': 'borderBottom',
				'padding-top': 'paddingTop',
				'padding-left': 'paddingLeft',
				'padding-right': 'paddingRight',
				'padding-bottom': 'paddingBottom'
			}

			if (window.getComputedStyle) {
				const fromStyle = window.getComputedStyle(from)

				props.forEach(function (prop) {
					if (!to.style[lookup[prop]]) {
						to.style[lookup[prop]] = fromStyle.getPropertyValue(prop)
					}
				})
			}
		}
	}
}
