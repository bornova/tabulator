/**
 * Clipboard keybinding action handlers.
 *
 * @type {{copyToClipboard: function(KeyboardEvent): void}}
 */
export default {
  /**
   * Copy the table selection to clipboard when not actively editing a cell.
   *
   * @this {object}
   * @returns {void}
   */
  copyToClipboard() {
    if (!this.table.modules.edit.currentCell) {
      if (this.table.modExists('clipboard', true)) {
        this.table.modules.clipboard.copy(false, true)
      }
    }
  }
}
