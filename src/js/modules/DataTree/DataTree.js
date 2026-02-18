import Module from '../../core/Module.js'

import Row from '../../core/row/Row.js'

import RowComponent from '../../core/row/RowComponent.js'

export default class DataTree extends Module {
  static moduleName = 'dataTree'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.indent = 10
    this.field = ''
    this.collapseEl = null
    this.expandEl = null
    this.branchEl = null
    this.elementField = false

    this.startOpen = () => {}

    this.registerTableOption('dataTree', false) // enable data tree
    this.registerTableOption('dataTreeFilter', true) // filter child rows
    this.registerTableOption('dataTreeSort', true) // sort child rows
    this.registerTableOption('dataTreeElementColumn', false)
    this.registerTableOption('dataTreeBranchElement', true) // show data tree branch element
    this.registerTableOption('dataTreeChildIndent', 9) // data tree child indent in px
    this.registerTableOption('dataTreeChildField', '_children') // data tre column field to look for child rows
    this.registerTableOption('dataTreeCollapseElement', false) // data tree row collapse element
    this.registerTableOption('dataTreeExpandElement', false) // data tree row expand element
    this.registerTableOption('dataTreeStartExpanded', false)
    this.registerTableOption('dataTreeChildColumnCalcs', false) // include visible data tree rows in column calculations
    this.registerTableOption('dataTreeSelectPropagate', false) // selecting a parent row selects its children

    // register component functions
    this.registerComponentFunction('row', 'treeCollapse', this.collapseRow.bind(this))
    this.registerComponentFunction('row', 'treeExpand', this.expandRow.bind(this))
    this.registerComponentFunction('row', 'treeToggle', this.toggleRow.bind(this))
    this.registerComponentFunction('row', 'getTreeParent', this.getTreeParent.bind(this))
    this.registerComponentFunction('row', 'getTreeChildren', this.getRowChildren.bind(this))
    this.registerComponentFunction('row', 'addTreeChild', this.addTreeChildRow.bind(this))
    this.registerComponentFunction('row', 'isTreeExpanded', this.isRowExpanded.bind(this))
  }

  /**
   * Initialize data tree module options, controls, and subscriptions.
   * @returns {void}
   */
  initialize() {
    if (this.table.options.dataTree) {
      let dummyEl = null
      const options = this.table.options

      this.field = options.dataTreeChildField
      this.indent = options.dataTreeChildIndent

      if (this.options('movableRows')) {
        console.warn(
          'The movableRows option is not available with dataTree enabled, moving of child rows could result in unpredictable behavior'
        )
      }

      if (options.dataTreeBranchElement) {
        if (options.dataTreeBranchElement === true) {
          this.branchEl = document.createElement('div')
          this.branchEl.classList.add('tabulator-data-tree-branch')
        } else {
          if (typeof options.dataTreeBranchElement === 'string') {
            dummyEl = document.createElement('div')
            dummyEl.innerHTML = options.dataTreeBranchElement
            this.branchEl = dummyEl.firstChild
          } else {
            this.branchEl = options.dataTreeBranchElement
          }
        }
      } else {
        this.branchEl = document.createElement('div')
        this.branchEl.classList.add('tabulator-data-tree-branch-empty')
      }

      if (options.dataTreeCollapseElement) {
        if (typeof options.dataTreeCollapseElement === 'string') {
          dummyEl = document.createElement('div')
          dummyEl.innerHTML = options.dataTreeCollapseElement
          this.collapseEl = dummyEl.firstChild
        } else {
          this.collapseEl = options.dataTreeCollapseElement
        }
      } else {
        this.collapseEl = document.createElement('div')
        this.collapseEl.classList.add('tabulator-data-tree-control')
        this.collapseEl.tabIndex = 0
        this.collapseEl.innerHTML = "<div class='tabulator-data-tree-control-collapse'></div>"
      }

      if (options.dataTreeExpandElement) {
        if (typeof options.dataTreeExpandElement === 'string') {
          dummyEl = document.createElement('div')
          dummyEl.innerHTML = options.dataTreeExpandElement
          this.expandEl = dummyEl.firstChild
        } else {
          this.expandEl = options.dataTreeExpandElement
        }
      } else {
        this.expandEl = document.createElement('div')
        this.expandEl.classList.add('tabulator-data-tree-control')
        this.expandEl.tabIndex = 0
        this.expandEl.innerHTML = "<div class='tabulator-data-tree-control-expand'></div>"
      }

      switch (typeof options.dataTreeStartExpanded) {
        case 'boolean':
          this.startOpen = (row, index) => options.dataTreeStartExpanded
          break

        case 'function':
          this.startOpen = options.dataTreeStartExpanded
          break

        default:
          this.startOpen = (row, index) => options.dataTreeStartExpanded[index]
          break
      }

      this.subscribe('row-init', this.initializeRow.bind(this))
      this.subscribe('row-layout-after', this.layoutRow.bind(this))
      this.subscribe('row-deleting', this.rowDeleting.bind(this))
      this.subscribe('row-deleted', this.rowDelete.bind(this), 0)
      this.subscribe('row-data-changed', this.rowDataChanged.bind(this), 10)
      this.subscribe('cell-value-updated', this.cellValueChanged.bind(this))
      this.subscribe('edit-cancelled', this.cellValueChanged.bind(this))
      this.subscribe('column-moving-rows', this.columnMoving.bind(this))
      this.subscribe('table-built', this.initializeElementField.bind(this))
      this.subscribe('table-redrawing', this.tableRedrawing.bind(this))

      this.registerDisplayHandler(this.getRows.bind(this), 30)
    }
  }

  /**
   * Reinitialize child rows when table is force-redrawn.
   * @param {boolean} force Force redraw state.
   * @returns {void}
   */
  tableRedrawing(force) {
    let rows

    if (force) {
      rows = this.table.rowManager.getRows()

      rows.forEach((row) => {
        this.reinitializeRowChildren(row)
      })
    }
  }

  /**
   * Resolve which field column should render tree controls.
   * @returns {void}
   */
  initializeElementField() {
    const firstCol = this.table.columnManager.getFirstVisibleColumn()

    this.elementField = this.table.options.dataTreeElementColumn || (firstCol ? firstCol.field : false)
  }

  /**
   * Get direct and recursive child row components for a row.
   * @param {Row} row Internal row.
   * @returns {Array<object>}
   */
  getRowChildren(row) {
    return this.getTreeChildren(row, true)
  }

  /**
   * Gather movable child rows when columns are moving.
   * @returns {Array<Row>}
   */
  columnMoving() {
    let rows = []

    this.table.rowManager.rows.forEach((row) => {
      rows = rows.concat(this.getTreeChildren(row, false, true))
    })

    return rows
  }

  /**
   * Handle row data changes that require tree structure redraw.
   * @param {Row} row Internal row.
   * @param {boolean} visible Whether row is currently visible.
   * @param {object} updatedData Updated row data payload.
   * @returns {void}
   */
  rowDataChanged(row, visible, updatedData) {
    if (this.redrawNeeded(updatedData)) {
      this.initializeRow(row)

      if (visible) {
        this.layoutRow(row)
        this.refreshData(true)
      }
    }
  }

  /**
   * Relayout tree UI when the configured element field value changes.
   * @param {object} cell Internal cell.
   * @returns {void}
   */
  cellValueChanged(cell) {
    const field = cell.column.getField()

    if (field === this.elementField) {
      this.layoutRow(cell.row)
    }
  }

  /**
   * Initialize data tree metadata for a row.
   * @param {Row} row Internal row.
   * @returns {void}
   */
  initializeRow(row) {
    const childArray = row.getData()[this.field]
    const isArray = Array.isArray(childArray)

    const children = isArray || (!isArray && typeof childArray === 'object' && childArray !== null)

    if (!children && row.modules.dataTree && row.modules.dataTree.branchEl) {
      row.modules.dataTree.branchEl.parentNode.removeChild(row.modules.dataTree.branchEl)
    }

    if (!children && row.modules.dataTree && row.modules.dataTree.controlEl) {
      row.modules.dataTree.controlEl.parentNode.removeChild(row.modules.dataTree.controlEl)
    }

    row.modules.dataTree = {
      index: row.modules.dataTree ? row.modules.dataTree.index : 0,
      open: children
        ? row.modules.dataTree
          ? row.modules.dataTree.open
          : this.startOpen(row.getComponent(), 0)
        : false,
      controlEl: row.modules.dataTree && children ? row.modules.dataTree.controlEl : false,
      branchEl: row.modules.dataTree && children ? row.modules.dataTree.branchEl : false,
      parent: row.modules.dataTree ? row.modules.dataTree.parent : false,
      children
    }
  }

  /**
   * Reinitialize all descendants for a row.
   * @param {Row} row Internal row.
   * @returns {void}
   */
  reinitializeRowChildren(row) {
    const children = this.getTreeChildren(row, false, true)

    children.forEach((child) => {
      child.reinitialize(true)
    })
  }

  /**
   * Layout tree controls and branch elements for a row.
   * @param {Row} row Internal row.
   * @returns {void}
   */
  layoutRow(row) {
    const cell = this.elementField ? row.getCell(this.elementField) : row.getCells()[0]
    const el = cell.getElement()
    const config = row.modules.dataTree

    if (config.branchEl) {
      if (config.branchEl.parentNode) {
        config.branchEl.parentNode.removeChild(config.branchEl)
      }
      config.branchEl = false
    }

    if (config.controlEl) {
      if (config.controlEl.parentNode) {
        config.controlEl.parentNode.removeChild(config.controlEl)
      }
      config.controlEl = false
    }

    this.generateControlElement(row, el)

    row.getElement().classList.add(`tabulator-tree-level-${config.index}`)

    if (config.index) {
      if (this.branchEl) {
        config.branchEl = this.branchEl.cloneNode(true)
        el.insertBefore(config.branchEl, el.firstChild)

        if (this.table.rtl) {
          config.branchEl.style.marginRight =
            (config.branchEl.offsetWidth + config.branchEl.style.marginLeft) * (config.index - 1) +
            config.index * this.indent +
            'px'
        } else {
          config.branchEl.style.marginLeft =
            (config.branchEl.offsetWidth + config.branchEl.style.marginRight) * (config.index - 1) +
            config.index * this.indent +
            'px'
        }
      } else {
        if (this.table.rtl) {
          el.style.paddingRight =
            parseInt(window.getComputedStyle(el, null).getPropertyValue('padding-right')) +
            config.index * this.indent +
            'px'
        } else {
          el.style.paddingLeft =
            parseInt(window.getComputedStyle(el, null).getPropertyValue('padding-left')) +
            config.index * this.indent +
            'px'
        }
      }
    }
  }

  /**
   * Create or replace expand/collapse control for a row.
   * @param {Row} row Internal row.
   * @param {HTMLElement} [el] Target cell element.
   * @returns {void}
   */
  generateControlElement(row, el) {
    const config = row.modules.dataTree
    const oldControl = config.controlEl

    el = el || row.getCells()[0].getElement()

    if (config.children !== false) {
      if (config.open) {
        config.controlEl = this.collapseEl.cloneNode(true)
        config.controlEl.addEventListener('click', (e) => {
          e.stopPropagation()
          this.collapseRow(row)
        })
      } else {
        config.controlEl = this.expandEl.cloneNode(true)
        config.controlEl.addEventListener('click', (e) => {
          e.stopPropagation()
          this.expandRow(row)
        })
      }

      config.controlEl.addEventListener('mousedown', (e) => {
        e.stopPropagation()
      })

      if (oldControl && oldControl.parentNode === el) {
        oldControl.parentNode.replaceChild(config.controlEl, oldControl)
      } else {
        el.insertBefore(config.controlEl, el.firstChild)
      }
    }
  }

  /**
   * Expand display row list with visible data-tree children.
   * @param {Array<Row>} rows Base row list.
   * @returns {Array<Row>}
   */
  getRows(rows) {
    const output = []

    rows.forEach((row, i) => {
      let config, children

      output.push(row)

      if (row instanceof Row) {
        row.create()

        config = row.modules.dataTree

        if (!config.index && config.children !== false) {
          children = this.getChildren(row, false, true)

          children.forEach((child) => {
            child.create()
            output.push(child)
          })
        }
      }
    })

    return output
  }

  /**
   * Get rendered children for a row, optionally including all descendants.
   * @param {Row} row Internal row.
   * @param {boolean} allChildren Include descendants regardless of open state.
   * @param {boolean} sortOnly Restrict sort behavior for child rows.
   * @returns {Array<Row>}
   */
  getChildren(row, allChildren, sortOnly) {
    const config = row.modules.dataTree
    let children = []
    const output = []

    if (!config) {
      return output
    }

    if (config.children !== false && (config.open || allChildren)) {
      if (!Array.isArray(config.children)) {
        config.children = this.generateChildren(row)
      }

      if (this.table.modExists('filter') && this.table.options.dataTreeFilter) {
        children = this.table.modules.filter.filter(config.children)
      } else {
        children = config.children
      }

      if (this.table.modExists('sort') && this.table.options.dataTreeSort) {
        this.table.modules.sort.sort(children, sortOnly)
      }

      children.forEach((child) => {
        output.push(child)

        const subChildren = this.getChildren(child, false, true)

        subChildren.forEach((sub) => {
          output.push(sub)
        })
      })
    }

    return output
  }

  /**
   * Generate internal child rows from row child data.
   * @param {Row} row Parent row.
   * @returns {Array<Row>}
   */
  generateChildren(row) {
    const children = []

    let childArray = row.getData()[this.field]

    if (!Array.isArray(childArray)) {
      childArray = [childArray]
    }

    childArray.forEach((childData) => {
      const childRow = new Row(childData || {}, this.table.rowManager)

      childRow.create()

      childRow.modules.dataTree.index = row.modules.dataTree.index + 1
      childRow.modules.dataTree.parent = row

      if (childRow.modules.dataTree.children) {
        childRow.modules.dataTree.open = this.startOpen(childRow.getComponent(), childRow.modules.dataTree.index)
      }
      children.push(childRow)
    })

    return children
  }

  /**
   * Expand a data-tree row.
   * @param {Row} row Internal row.
   * @param {boolean} [silent] Unused legacy parameter.
   * @returns {void}
   */
  expandRow(row, silent) {
    const config = row.modules.dataTree

    if (config.children !== false) {
      config.open = true

      row.reinitialize()

      this.refreshData(true)

      this.dispatchExternal('dataTreeRowExpanded', row.getComponent(), row.modules.dataTree.index)
    }
  }

  /**
   * Collapse a data-tree row.
   * @param {Row} row Internal row.
   * @returns {void}
   */
  collapseRow(row) {
    const config = row.modules.dataTree

    if (config.children !== false) {
      config.open = false

      row.reinitialize()

      this.refreshData(true)

      this.dispatchExternal('dataTreeRowCollapsed', row.getComponent(), row.modules.dataTree.index)
    }
  }

  /**
   * Toggle expanded state for a data-tree row.
   * @param {Row} row Internal row.
   * @returns {void}
   */
  toggleRow(row) {
    const config = row.modules.dataTree

    if (config.children !== false) {
      config.open ? this.collapseRow(row) : this.expandRow(row)
    }
  }

  /**
   * Check if a row is currently expanded.
   * @param {Row} row Internal row.
   * @returns {boolean}
   */
  isRowExpanded(row) {
    return row.modules.dataTree.open
  }

  /**
   * Get parent row component for a data-tree row.
   * @param {Row} row Internal row.
   * @returns {object|boolean}
   */
  getTreeParent(row) {
    return row.modules.dataTree.parent ? row.modules.dataTree.parent.getComponent() : false
  }

  /**
   * Resolve the root ancestor row for a data-tree row.
   * @param {Row} row Internal row.
   * @returns {Row}
   */
  getTreeParentRoot(row) {
    return row.modules.dataTree && row.modules.dataTree.parent
      ? this.getTreeParentRoot(row.modules.dataTree.parent)
      : row
  }

  /**
   * Return filtered direct child rows for a row.
   * @param {Row} row Internal row.
   * @returns {Array<Row>}
   */
  getFilteredTreeChildren(row) {
    const config = row.modules.dataTree
    const output = []
    let children

    if (config.children) {
      if (!Array.isArray(config.children)) {
        config.children = this.generateChildren(row)
      }

      if (this.table.modExists('filter') && this.table.options.dataTreeFilter) {
        children = this.table.modules.filter.filter(config.children)
      } else {
        children = config.children
      }

      children.forEach((childRow) => {
        if (childRow instanceof Row) {
          output.push(childRow)
        }
      })
    }

    return output
  }

  /**
   * Wipe child row instances before parent row deletion.
   * @param {Row} row Internal row.
   * @returns {void}
   */
  rowDeleting(row) {
    const config = row.modules.dataTree

    if (config && config.children && Array.isArray(config.children)) {
      config.children.forEach((childRow) => {
        if (childRow instanceof Row) {
          childRow.wipe()
        }
      })
    }
  }

  /**
   * Handle post-delete cleanup and parent child-array updates.
   * @param {Row} row Deleted row.
   * @returns {void}
   */
  rowDelete(row) {
    const parent = row.modules.dataTree.parent
    let childIndex

    if (parent) {
      childIndex = this.findChildIndex(row, parent)

      if (childIndex !== false) {
        parent.data[this.field].splice(childIndex, 1)
      }

      if (!parent.data[this.field].length) {
        delete parent.data[this.field]
      }

      this.initializeRow(parent)
      this.layoutRow(parent)
    }

    this.refreshData(true)
  }

  /**
   * Add a child row data object to a tree row.
   * @param {Row} row Parent row.
   * @param {object|string} data Child row data.
   * @param {boolean} [top] Insert at start when true.
   * @param {*} [index] Anchor row/index for insertion.
   * @returns {void}
   */
  addTreeChildRow(row, data, top, index) {
    let childIndex = false

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (!Array.isArray(row.data[this.field])) {
      row.data[this.field] = []

      row.modules.dataTree.open = this.startOpen(row.getComponent(), row.modules.dataTree.index)
    }

    if (typeof index !== 'undefined') {
      childIndex = this.findChildIndex(index, row)

      if (childIndex !== false) {
        row.data[this.field].splice(top ? childIndex : childIndex + 1, 0, data)
      }
    }

    if (childIndex === false) {
      if (top) {
        row.data[this.field].unshift(data)
      } else {
        row.data[this.field].push(data)
      }
    }

    this.initializeRow(row)
    this.layoutRow(row)

    this.refreshData(true)
  }

  /**
   * Find a child index in a parent's child data collection.
   * @param {*} subject Child lookup value.
   * @param {Row} parent Parent row.
   * @returns {number|boolean}
   */
  findChildIndex(subject, parent) {
    let match = false

    if (typeof subject === 'object') {
      if (subject instanceof Row) {
        // subject is row element
        match = subject.data
      } else if (subject instanceof RowComponent) {
        // subject is public row component
        match = subject._getSelf().data
      } else if (typeof HTMLElement !== 'undefined' && subject instanceof HTMLElement) {
        if (parent.modules.dataTree) {
          match = parent.modules.dataTree.children.find((childRow) => {
            return childRow instanceof Row ? childRow.element === subject : false
          })

          if (match) {
            match = match.data
          }
        }
      } else if (subject === null) {
        match = false
      }
    } else if (typeof subject === 'undefined') {
      match = false
    } else {
      // subject should be treated as the index of the row
      match = parent.data[this.field].find((row) => {
        return row.data[this.table.options.index] === subject
      })
    }

    if (match) {
      if (Array.isArray(parent.data[this.field])) {
        match = parent.data[this.field].indexOf(match)
      }

      if (match === -1) {
        match = false
      }
    }

    // catch all for any other type of input

    return match
  }

  /**
   * Get child rows or child row components for a row.
   * @param {Row} row Internal row.
   * @param {boolean} component Return public components when true.
   * @param {boolean} recurse Include descendants recursively.
   * @returns {Array<Row|object>}
   */
  getTreeChildren(row, component, recurse) {
    const config = row.modules.dataTree
    const output = []

    if (config && config.children) {
      if (!Array.isArray(config.children)) {
        config.children = this.generateChildren(row)
      }

      config.children.forEach((childRow) => {
        if (childRow instanceof Row) {
          output.push(component ? childRow.getComponent() : childRow)

          if (recurse) {
            this.getTreeChildren(childRow, component, recurse).forEach((child) => {
              output.push(child)
            })
          }
        }
      })
    }

    return output
  }

  /**
   * Get configured child data field.
   * @returns {string}
   */
  getChildField() {
    return this.field
  }

  /**
   * Determine if row updates require tree redraw.
   * @param {object} data Updated data payload.
   * @returns {boolean}
   */
  redrawNeeded(data) {
    return (
      (this.field ? data[this.field] !== undefined : false) ||
      (this.elementField ? data[this.elementField] !== undefined : false)
    )
  }
}
