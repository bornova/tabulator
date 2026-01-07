export default {
  keyBlock: function (e) {
    e.stopPropagation()
    e.preventDefault()
  },

  scrollPageUp: function (e) {
    const rowManager = this.table.rowManager
    const newPos = rowManager.scrollTop - rowManager.element.clientHeight

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      if (newPos >= 0) {
        rowManager.element.scrollTop = newPos
      } else {
        rowManager.scrollToRow(rowManager.getDisplayRows()[0])
      }
    }

    this.table.element.focus()
  },

  scrollPageDown: function (e) {
    const rowManager = this.table.rowManager
    const newPos = rowManager.scrollTop + rowManager.element.clientHeight
    const scrollMax = rowManager.element.scrollHeight

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      if (newPos <= scrollMax) {
        rowManager.element.scrollTop = newPos
      } else {
        rowManager.scrollToRow(rowManager.getDisplayRows()[rowManager.displayRowsCount - 1])
      }
    }

    this.table.element.focus()
  },

  scrollToStart: function (e) {
    const rowManager = this.table.rowManager

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      rowManager.scrollToRow(rowManager.getDisplayRows()[0])
    }

    this.table.element.focus()
  },

  scrollToEnd: function (e) {
    const rowManager = this.table.rowManager

    e.preventDefault()

    if (rowManager.displayRowsCount) {
      rowManager.scrollToRow(rowManager.getDisplayRows()[rowManager.displayRowsCount - 1])
    }

    this.table.element.focus()
  },

  navPrev: function (e) {
    this.dispatch('keybinding-nav-prev', e)
  },

  navNext: function (e) {
    this.dispatch('keybinding-nav-next', e)
  },

  navLeft: function (e) {
    this.dispatch('keybinding-nav-left', e)
  },

  navRight: function (e) {
    this.dispatch('keybinding-nav-right', e)
  },

  navUp: function (e) {
    this.dispatch('keybinding-nav-up', e)
  },

  navDown: function (e) {
    this.dispatch('keybinding-nav-down', e)
  }
}
