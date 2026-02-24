// resize columns to fit
/**
 * Resize columns to fit the available table width.
 *
 * @this {Object}
 * @param {Array<Object>} columns Columns to resize.
 * @returns {void}
 */
export default function (columns) {
  let totalWidth = this.table.rowManager.element.getBoundingClientRect().width // table element width
  let fixedWidth = 0 // total width of columns with a defined width
  let flexWidth = 0 // total width available to flexible columns
  let flexGrowUnits = 0 // total number of widthGrow blocks across all columns
  let flexColWidth // desired width of flexible columns
  const flexColumns = [] // array of flexible width columns
  const fixedShrinkColumns = [] // array of fixed width columns that can shrink
  let flexShrinkUnits = 0 // total number of widthShrink blocks across all columns
  let overflowWidth // horizontal overflow width
  let gapFill // number of pixels to be added to final column to close and half pixel gaps

  function calcWidth(width) {
    let colWidth

    if (typeof width === 'string') {
      if (width.indexOf('%') > -1) {
        colWidth = (totalWidth / 100) * parseInt(width, 10)
      } else {
        colWidth = parseInt(width, 10)
      }
    } else {
      colWidth = width
    }

    return colWidth
  }

  // ensure columns resize to take up the correct amount of space
  function scaleColumns(columns, freeSpace, colWidth, shrinkCols) {
    const oversizeCols = []
    let oversizeSpace = 0
    let remainingSpace
    let nextColWidth
    let remainingFlexGrowUnits = flexGrowUnits
    let gap
    let changeUnits = 0
    const undersizeCols = []
    const getChangeUnit = (col) =>
      shrinkCols ? col.column.definition.widthShrink || 1 : col.column.definition.widthGrow || 1

    function calcGrow(col) {
      return colWidth * (col.column.definition.widthGrow || 1)
    }

    function calcShrink(col) {
      return calcWidth(col.width) - colWidth * (col.column.definition.widthShrink || 0)
    }

    columns.forEach((col) => {
      const width = shrinkCols ? calcShrink(col) : calcGrow(col)

      if (col.column.minWidth >= width) {
        oversizeCols.push(col)
      } else {
        if (col.column.maxWidth && col.column.maxWidth < width) {
          col.width = col.column.maxWidth
          freeSpace -= col.column.maxWidth

          remainingFlexGrowUnits -= getChangeUnit(col)

          if (remainingFlexGrowUnits) {
            colWidth = Math.floor(freeSpace / remainingFlexGrowUnits)
          }
        } else {
          undersizeCols.push(col)
          changeUnits += getChangeUnit(col)
        }
      }
    })

    if (oversizeCols.length) {
      oversizeCols.forEach((col) => {
        oversizeSpace += shrinkCols ? col.width - col.column.minWidth : col.column.minWidth
        col.width = col.column.minWidth
      })

      remainingSpace = freeSpace - oversizeSpace

      nextColWidth = changeUnits ? Math.floor(remainingSpace / changeUnits) : remainingSpace

      gap = scaleColumns(undersizeCols, remainingSpace, nextColWidth, shrinkCols)
    } else {
      gap = changeUnits ? freeSpace - Math.floor(freeSpace / changeUnits) * changeUnits : freeSpace

      undersizeCols.forEach((column) => {
        column.width = shrinkCols ? calcShrink(column) : calcGrow(column)
      })
    }

    return gap
  }

  if (this.table.options.responsiveLayout && this.table.modExists('responsiveLayout', true)) {
    this.table.modules.responsiveLayout.update()
  }

  // adjust for vertical scrollbar if present
  if (this.table.rowManager.element.scrollHeight > this.table.rowManager.element.clientHeight) {
    totalWidth -= this.table.rowManager.element.offsetWidth - this.table.rowManager.element.clientWidth
  }

  columns.forEach((column) => {
    let width, minWidth, colWidth

    if (column.visible) {
      width = column.definition.width
      minWidth = parseInt(column.minWidth, 10)

      if (width) {
        colWidth = calcWidth(width)

        fixedWidth += colWidth > minWidth ? colWidth : minWidth

        if (column.definition.widthShrink) {
          fixedShrinkColumns.push({
            column,
            width: colWidth > minWidth ? colWidth : minWidth
          })
          flexShrinkUnits += column.definition.widthShrink
        }
      } else {
        flexColumns.push({
          column,
          width: 0
        })
        flexGrowUnits += column.definition.widthGrow || 1
      }
    }
  })

  // calculate available space
  flexWidth = totalWidth - fixedWidth

  // calculate correct column size
  flexColWidth = Math.floor(flexWidth / flexGrowUnits)

  // generate column widths
  gapFill = scaleColumns(flexColumns, flexWidth, flexColWidth, false)

  // increase width of last column to account for rounding errors
  if (flexColumns.length && gapFill > 0) {
    flexColumns[flexColumns.length - 1].width += gapFill
  }

  // calculate space for columns to be shrunk into
  flexColumns.forEach((col) => {
    flexWidth -= col.width
  })

  overflowWidth = Math.abs(gapFill) + flexWidth

  // shrink oversize columns if there is no available space
  if (overflowWidth > 0 && flexShrinkUnits) {
    gapFill = scaleColumns(fixedShrinkColumns, overflowWidth, Math.floor(overflowWidth / flexShrinkUnits), true)
  }

  // decrease width of last column to account for rounding errors
  if (gapFill && fixedShrinkColumns.length) {
    fixedShrinkColumns[fixedShrinkColumns.length - 1].width -= gapFill
  }

  flexColumns.forEach((col) => {
    col.column.setWidth(col.width)
  })

  fixedShrinkColumns.forEach((col) => {
    col.column.setWidth(col.width)
  })
}
