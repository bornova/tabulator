/**
 * Default history redo action handlers.
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
   * Reapply an edited cell value.
   *
   * @param {Object} action History action.
   * @returns {void}
   */
  cellEdit(action) {
    action.component.setValueProcessData(action.data.newValue)
    action.component.cellRendered()
  },

  /**
   * Reapply a row add action.
   *
   * @this {Object}
   * @param {Object} action History action.
   * @returns {void}
   */
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

  /**
   * Reapply a row delete action.
   *
   * @this {Object}
   * @param {Object} action History action.
   * @returns {void}
   */
  rowDelete(action) {
    action.component.deleteActual()

    this.table.rowManager.checkPlaceholder()
  },

  /**
   * Reapply a row move action.
   *
   * @this {Object}
   * @param {Object} action History action.
   * @returns {void}
   */
  rowMove(action) {
    const rowManager = this.table.rowManager

    rowManager.moveRowActual(action.component, rowManager.getRowFromPosition(action.data.posTo), action.data.after)

    rowManager.regenerateRowPositions()
    rowManager.reRenderInPosition()
  }
}
