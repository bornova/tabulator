/**
 * History keybinding action handlers.
 *
 * @type {{
 *   undo: function(KeyboardEvent): void,
 *   redo: function(KeyboardEvent): void
 * }}
 */
function canUseHistory(table) {
  return table.options.history && table.modExists('history') && table.modExists('edit')
}

export default {
  /**
   * Trigger undo when history is enabled and no editor is active.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  undo(e) {
    if (!canUseHistory(this.table)) {
      return
    }

    const cell = this.table.modules.edit.currentCell

    if (!cell) {
      e.preventDefault()
      this.table.modules.history.undo()
    }
  },

  /**
   * Trigger redo when history is enabled and no editor is active.
   *
   * @this {object}
   * @param {KeyboardEvent} e Keyboard event.
   * @returns {void}
   */
  redo(e) {
    if (!canUseHistory(this.table)) {
      return
    }

    const cell = this.table.modules.edit.currentCell

    if (!cell) {
      e.preventDefault()
      this.table.modules.history.redo()
    }
  }
}
