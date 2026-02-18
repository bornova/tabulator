export default {
  undo(e) {
    if (!(this.table.options.history && this.table.modExists('history') && this.table.modExists('edit'))) {
      return
    }

    const cell = this.table.modules.edit.currentCell

    if (!cell) {
      e.preventDefault()
      this.table.modules.history.undo()
    }
  },

  redo(e) {
    if (!(this.table.options.history && this.table.modExists('history') && this.table.modExists('edit'))) {
      return
    }

    const cell = this.table.modules.edit.currentCell

    if (!cell) {
      e.preventDefault()
      this.table.modules.history.redo()
    }
  }
}
