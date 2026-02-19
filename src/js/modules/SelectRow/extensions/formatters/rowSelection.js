import RowComponent from '../../../../core/row/RowComponent.js'

/**
 * Render a row selection checkbox formatter.
 *
 * @this {Object}
 * @param {Object} cell Cell component or header context.
 * @param {{rowRange?: string|Array<Object>|function}} formatterParams Formatter parameters.
 * @param {function(function): void} _onRendered Render callback registrar.
 * @returns {HTMLInputElement|string} Checkbox element or empty string.
 */
export default function (cell, formatterParams, _onRendered) {
  void _onRendered
  const checkbox = document.createElement('input')
  let blocked = false

  checkbox.type = 'checkbox'

  checkbox.setAttribute('aria-label', 'Select Row')

  if (!this.table.modExists('selectRow', true)) {
    return checkbox
  }

  const selectRowModule = this.table.modules.selectRow
  const isClickRangeMode = this.table.options.selectableRowsRangeMode === 'click'

  checkbox.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  if (typeof cell.getRow !== 'function') {
    checkbox.addEventListener('change', () => {
      if (selectRowModule.selectedRows.length) {
        this.table.deselectRow()
      } else {
        this.table.selectRow(formatterParams.rowRange)
      }
    })

    selectRowModule.registerHeaderSelectCheckbox(checkbox)
    return checkbox
  }

  const row = cell.getRow()

  if (!(row instanceof RowComponent)) {
    return ''
  }

  checkbox.addEventListener('change', () => {
    if (isClickRangeMode) {
      if (!blocked) {
        row.toggleSelect()
      } else {
        blocked = false
      }
    } else {
      row.toggleSelect()
    }
  })

  if (isClickRangeMode) {
    checkbox.addEventListener('click', (e) => {
      blocked = true
      selectRowModule.handleComplexRowClick(row._row, e)
    })
  }

  checkbox.checked = !!(row.isSelected && row.isSelected())
  selectRowModule.registerRowSelectCheckbox(row, checkbox)

  return checkbox
}
