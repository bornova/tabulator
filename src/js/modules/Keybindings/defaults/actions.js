export default {
  keyBlock(e) {
    e.stopPropagation()
    e.preventDefault()
  },

  scrollPageUp(e) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()
    const newPos = rowManager.scrollTop - rowManager.element.clientHeight

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      if (newPos >= 0) {
        rowManager.element.scrollTop = newPos
      } else {
        rowManager.scrollToRow(displayRows[0])
      }
    }

    this.table.element.focus()
  },

  scrollPageDown(e) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()
    const newPos = rowManager.scrollTop + rowManager.element.clientHeight
    const scrollMax = rowManager.element.scrollHeight

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      if (newPos <= scrollMax) {
        rowManager.element.scrollTop = newPos
      } else {
        rowManager.scrollToRow(displayRows[rowManager.displayRowsCount - 1])
      }
    }

    this.table.element.focus()
  },

  scrollToStart(e) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      rowManager.scrollToRow(displayRows[0])
    }

    this.table.element.focus()
  },

  scrollToEnd(e) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      rowManager.scrollToRow(displayRows[rowManager.displayRowsCount - 1])
    }

    this.table.element.focus()
  },

  navPrev(e) {
    this.dispatch('keybinding-nav-prev', e)
  },

  navNext(e) {
    this.dispatch('keybinding-nav-next', e)
  },

  navLeft(e) {
    this.dispatch('keybinding-nav-left', e)
  },

  navRight(e) {
    this.dispatch('keybinding-nav-right', e)
  },

  navUp(e) {
    this.dispatch('keybinding-nav-up', e)
  },

  navDown(e) {
    this.dispatch('keybinding-nav-down', e)
  }
}
