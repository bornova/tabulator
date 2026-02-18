export default {
  cellEdit(action) {
    action.component.setValueProcessData(action.data.newValue)
    action.component.cellRendered()
  },

  rowAdd(action) {
    const rowManager = this.table.rowManager
    const { data, pos, index } = action.data
    const newRow = rowManager.addRowActual(data, pos, index)

    if (this.table.options.groupBy && this.table.modExists('groupRows')) {
      this.table.modules.groupRows.updateGroupRows(true)
    }

    this._rebindRow(action.component, newRow)

    rowManager.checkPlaceholder()
  },

  rowDelete(action) {
    action.component.deleteActual()

    this.table.rowManager.checkPlaceholder()
  },

  rowMove(action) {
    const rowManager = this.table.rowManager

    rowManager.moveRowActual(action.component, rowManager.getRowFromPosition(action.data.posTo), action.data.after)

    rowManager.regenerateRowPositions()
    rowManager.reRenderInPosition()
  }
}
