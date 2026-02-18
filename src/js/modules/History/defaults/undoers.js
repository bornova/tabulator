export default {
  cellEdit(action) {
    action.component.setValueProcessData(action.data.oldValue)
    action.component.cellRendered()
  },

  rowAdd(action) {
    action.component.deleteActual()

    this.table.rowManager.checkPlaceholder()
  },

  rowDelete(action) {
    const rowManager = this.table.rowManager
    const { data, pos, index } = action.data
    const newRow = rowManager.addRowActual(data, pos, index)

    if (this.table.options.groupBy && this.table.modExists('groupRows')) {
      this.table.modules.groupRows.updateGroupRows(true)
    }

    this._rebindRow(action.component, newRow)

    rowManager.checkPlaceholder()
  },

  rowMove(action) {
    const rowManager = this.table.rowManager
    const after = action.data.posFrom - action.data.posTo > 0

    rowManager.moveRowActual(action.component, rowManager.getRowFromPosition(action.data.posFrom), after)

    rowManager.regenerateRowPositions()
    rowManager.reRenderInPosition()
  }
}
