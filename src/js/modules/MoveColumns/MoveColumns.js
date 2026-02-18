import Module from '../../core/Module.js'
import Helpers from '../../core/tools/Helpers.js'

export default class MoveColumns extends Module {
  static moduleName = 'moveColumn'

  constructor(table) {
    super(table)

    this.placeholderElement = this.createPlaceholderElement()
    this.hoverElement = false // floating column header element
    this.checkTimeout = false // click check timeout holder
    this.checkPeriod = 250 // period to wait on mousedown to consider this a move and not a click
    this.moving = false // currently moving column
    this.toCol = false // destination column
    this.toColAfter = false // position of moving column relative to the destination column
    this.startX = 0 // starting position within header element
    this.autoScrollMargin = 40 // auto scroll on edge when within margin
    this.autoScrollStep = 5 // auto scroll distance in pixels
    this.autoScrollTimeout = false // auto scroll timeout
    this.touchMove = false

    this.moveHover = this.moveHover.bind(this)
    this.endMove = this.endMove.bind(this)

    this.registerTableOption('movableColumns', false) // enable movable columns
  }

  createPlaceholderElement() {
    const el = document.createElement('div')

    el.classList.add('tabulator-col')
    el.classList.add('tabulator-col-placeholder')

    return el
  }

  initialize() {
    if (this.table.options.movableColumns) {
      this.subscribe('column-init', this.initializeColumn.bind(this))
      this.subscribe('alert-show', this.abortMove.bind(this))
    }
  }

  abortMove() {
    clearTimeout(this.checkTimeout)
  }

  initializeColumn(column) {
    const config = {}
    let colEl

    if (!column.modules.frozen && !column.isGroup && !column.isRowHeader) {
      colEl = column.getElement()

      config.mousemove = (e) => {
        if (column.parent === this.moving.parent) {
          if (
            (this.touchMove ? e.touches[0].pageX : e.pageX) -
              Helpers.elOffset(colEl).left +
              this.table.columnManager.contentsElement.scrollLeft >
            column.getWidth() / 2
          ) {
            if (this.toCol !== column || !this.toColAfter) {
              colEl.parentNode.insertBefore(this.placeholderElement, colEl.nextSibling)
              this.moveColumn(column, true)
            }
          } else {
            if (this.toCol !== column || this.toColAfter) {
              colEl.parentNode.insertBefore(this.placeholderElement, colEl)
              this.moveColumn(column, false)
            }
          }
        }
      }

      colEl.addEventListener('mousedown', (e) => {
        this.touchMove = false
        if (e.which === 1) {
          this.checkTimeout = setTimeout(() => {
            this.startMove(e, column)
          }, this.checkPeriod)
        }
      })

      colEl.addEventListener('mouseup', (e) => {
        if (e.which === 1) {
          if (this.checkTimeout) {
            clearTimeout(this.checkTimeout)
          }
        }
      })

      this.bindTouchEvents(column)
    }

    column.modules.moveColumn = config
  }

  bindTouchEvents(column) {
    const colEl = column.getElement()
    let startXMove = false // shifting center position of the cell
    let nextCol
    let prevCol
    let nextColWidth
    let prevColWidth
    let nextColWidthLast
    let prevColWidthLast

    colEl.addEventListener(
      'touchstart',
      (e) => {
        this.checkTimeout = setTimeout(() => {
          this.touchMove = true
          nextCol = column.nextColumn()
          nextColWidth = nextCol ? nextCol.getWidth() / 2 : 0
          prevCol = column.prevColumn()
          prevColWidth = prevCol ? prevCol.getWidth() / 2 : 0
          nextColWidthLast = 0
          prevColWidthLast = 0
          startXMove = false

          this.startMove(e, column)
        }, this.checkPeriod)
      },
      { passive: true }
    )

    colEl.addEventListener(
      'touchmove',
      (e) => {
        let diff, moveToCol

        if (this.moving) {
          this.moveHover(e)

          if (!startXMove) {
            startXMove = e.touches[0].pageX
          }

          diff = e.touches[0].pageX - startXMove

          if (diff > 0) {
            if (nextCol && diff - nextColWidthLast > nextColWidth) {
              moveToCol = nextCol

              if (moveToCol !== column) {
                startXMove = e.touches[0].pageX
                moveToCol
                  .getElement()
                  .parentNode.insertBefore(this.placeholderElement, moveToCol.getElement().nextSibling)
                this.moveColumn(moveToCol, true)
              }
            }
          } else {
            if (prevCol && -diff - prevColWidthLast > prevColWidth) {
              moveToCol = prevCol

              if (moveToCol !== column) {
                startXMove = e.touches[0].pageX
                moveToCol.getElement().parentNode.insertBefore(this.placeholderElement, moveToCol.getElement())
                this.moveColumn(moveToCol, false)
              }
            }
          }

          if (moveToCol) {
            nextCol = moveToCol.nextColumn()
            nextColWidthLast = nextColWidth
            nextColWidth = nextCol ? nextCol.getWidth() / 2 : 0
            prevCol = moveToCol.prevColumn()
            prevColWidthLast = prevColWidth
            prevColWidth = prevCol ? prevCol.getWidth() / 2 : 0
          }
        }
      },
      { passive: true }
    )

    colEl.addEventListener('touchend', (e) => {
      if (this.checkTimeout) {
        clearTimeout(this.checkTimeout)
      }
      if (this.moving) {
        this.endMove(e)
      }
    })
  }

  startMove(e, column) {
    const element = column.getElement()
    const headerElement = this.table.columnManager.getContentsElement()
    const headersElement = this.table.columnManager.getHeadersElement()

    // Prevent moving columns when range selection is active
    if (this.table.modules.selectRange && this.table.modules.selectRange.columnSelection) {
      if (this.table.modules.selectRange.mousedown && this.table.modules.selectRange.selecting === 'column') {
        return
      }
    }

    this.moving = column
    this.startX = (this.touchMove ? e.touches[0].pageX : e.pageX) - Helpers.elOffset(element).left

    this.table.element.classList.add('tabulator-block-select')

    // create placeholder
    this.placeholderElement.style.width = `${column.getWidth()}px`
    this.placeholderElement.style.height = `${column.getHeight()}px`

    element.parentNode.insertBefore(this.placeholderElement, element)
    element.parentNode.removeChild(element)

    // create hover element
    this.hoverElement = element.cloneNode(true)
    this.hoverElement.classList.add('tabulator-moving')

    headerElement.appendChild(this.hoverElement)

    this.hoverElement.style.left = '0'
    this.hoverElement.style.bottom = `${headerElement.clientHeight - headersElement.offsetHeight}px`

    if (!this.touchMove) {
      this._bindMouseMove()

      document.body.addEventListener('mousemove', this.moveHover)
      document.body.addEventListener('mouseup', this.endMove)
    }

    this.moveHover(e)

    this.dispatch('column-moving', e, this.moving)
  }

  _bindMouseMove() {
    this.table.columnManager.columnsByIndex.forEach((column) => {
      if (column.modules.moveColumn.mousemove) {
        column.getElement().addEventListener('mousemove', column.modules.moveColumn.mousemove)
      }
    })
  }

  _unbindMouseMove() {
    this.table.columnManager.columnsByIndex.forEach((column) => {
      if (column.modules.moveColumn.mousemove) {
        column.getElement().removeEventListener('mousemove', column.modules.moveColumn.mousemove)
      }
    })
  }

  moveColumn(column, after) {
    const movingCells = this.moving.getCells()

    this.toCol = column
    this.toColAfter = after

    column.getCells().forEach((cell, i) => {
      const cellEl = cell.getElement(true)

      if (cellEl.parentNode && movingCells[i]) {
        const target = after ? cellEl.nextSibling : cellEl
        cellEl.parentNode.insertBefore(movingCells[i].getElement(), target)
      }
    })
  }

  endMove(e) {
    if (e.which === 1 || this.touchMove) {
      this._unbindMouseMove()

      this.placeholderElement.parentNode.insertBefore(this.moving.getElement(), this.placeholderElement.nextSibling)
      this.placeholderElement.parentNode.removeChild(this.placeholderElement)
      this.hoverElement.parentNode.removeChild(this.hoverElement)

      this.table.element.classList.remove('tabulator-block-select')

      if (this.toCol) {
        this.table.columnManager.moveColumnActual(this.moving, this.toCol, this.toColAfter)
      }

      this.moving = false
      this.toCol = false
      this.toColAfter = false

      if (!this.touchMove) {
        document.body.removeEventListener('mousemove', this.moveHover)
        document.body.removeEventListener('mouseup', this.endMove)
      }
    }
  }

  moveHover(e) {
    const columnHolder = this.table.columnManager.getContentsElement()
    const scrollLeft = columnHolder.scrollLeft
    const xPos = (this.touchMove ? e.touches[0].pageX : e.pageX) - Helpers.elOffset(columnHolder).left + scrollLeft
    let scrollPos

    this.hoverElement.style.left = `${xPos - this.startX}px`

    if (xPos - scrollLeft < this.autoScrollMargin) {
      if (!this.autoScrollTimeout) {
        this.autoScrollTimeout = setTimeout(() => {
          scrollPos = Math.max(0, scrollLeft - this.autoScrollStep)
          this.table.rowManager.getElement().scrollLeft = scrollPos
          this.autoScrollTimeout = false
        }, 1)
      }
    }

    if (scrollLeft + columnHolder.clientWidth - xPos < this.autoScrollMargin) {
      if (!this.autoScrollTimeout) {
        this.autoScrollTimeout = setTimeout(() => {
          scrollPos = Math.min(columnHolder.clientWidth, scrollLeft + this.autoScrollStep)
          this.table.rowManager.getElement().scrollLeft = scrollPos
          this.autoScrollTimeout = false
        }, 1)
      }
    }
  }
}
