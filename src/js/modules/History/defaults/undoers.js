/**
 * Default history undo action handlers.
 *
 * @type {{
 *   cellEdit: function(Object): void,
 *   rowAdd: function(Object): void,
 *   rowDelete: function(Object): void,
 *   rowMove: function(Object): void
 * }}
 */
export default {
  /**
   * Revert an edited cell value.
   *
   * @param {Object} action History action.
   */
  cellEdit(action) {
    action.component.setValueProcessData(action.data.oldValue)
    action.component.cellRendered()
  },

  /**
   * Revert a row add action.
   *
   * @this {Object}
   * @param {Object} action History action.
   */
  rowAdd(action) {
    const rowManager = this.table.rowManager

    action.component.deleteActual()

    rowManager.checkPlaceholder()
  },

  /**
   * Revert a row delete action.
   *
   * @this {Object}
   * @param {Object} action History action.
   */
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

  /**
   * Revert a row move action.
   *
   * @this {Object}
   * @param {Object} action History action.
   */
  rowMove(action) {
    const rowManager = this.table.rowManager
    const after = action.data.posFrom - action.data.posTo > 0

    rowManager.moveRowActual(action.component, rowManager.getRowFromPosition(action.data.posFrom), after)

    rowManager.regenerateRowPositions()
    rowManager.reRenderInPosition()
  }
}
