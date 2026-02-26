import Helpers from '../../core/tools/Helpers.js'
import GroupComponent from './GroupComponent.js'

// Group functions
export default class Group {
  /**
   * @param {object} groupManager Group manager.
   * @param {Group|false} parent Parent group.
   * @param {number} level Group level.
   * @param {*} key Group key.
   * @param {string|false} field Group field.
   * @param {Function} generator Header generator.
   * @param {Group|false} oldGroup Previous group instance.
   */
  constructor(groupManager, parent, level, key, field, generator, oldGroup) {
    this.groupManager = groupManager
    this.parent = parent
    this.key = key
    this.level = level
    this.field = field
    this.hasSubGroups = level < groupManager.groupIDLookups.length - 1
    this.addRow = this.hasSubGroups ? this._addRowToGroup : this._addRow
    this.type = 'group' // type of element
    this.old = oldGroup
    this.rows = []
    this.groups = []
    this.groupList = []
    this.generator = generator
    this.element = false
    this.elementContents = false
    this.height = 0
    this.outerHeight = 0
    this.initialized = false
    this.calcs = {}
    this.modules = {}
    this.arrowElement = false

    this.visible = oldGroup
      ? oldGroup.visible
      : groupManager.startOpen[level] !== undefined
        ? groupManager.startOpen[level]
        : groupManager.startOpen[0]

    this.component = null

    this.createElements()
    this.addBindings()

    this.createValueGroups()
  }

  /**
   * Wipe group state and optionally only elements.
   * @param {boolean} [elementsOnly] Only wipe elements.
   */
  wipe(elementsOnly) {
    if (!elementsOnly) {
      if (this.groupList.length) {
        this.groupList.forEach((group) => {
          group.wipe()
        })
      } else {
        this.rows.forEach((row) => {
          if (row.modules) {
            delete row.modules.group
          }
        })
      }
    }

    this.element = false
    this.arrowElement = false
    this.elementContents = false
  }

  /**
   * Create group header elements.
   */
  createElements() {
    const arrow = document.createElement('div')
    arrow.classList.add('tabulator-arrow')

    this.element = document.createElement('div')
    this.element.classList.add('tabulator-row', 'tabulator-group', `tabulator-group-level-${this.level}`)
    this.element.setAttribute('role', 'rowgroup')

    this.arrowElement = document.createElement('div')
    this.arrowElement.classList.add('tabulator-group-toggle')
    this.arrowElement.appendChild(arrow)

    // setup movable rows
    if (this.groupManager.table.options.movableRows !== false && this.groupManager.table.modExists('moveRow')) {
      this.groupManager.table.modules.moveRow.initializeGroupHeader(this)
    }
  }

  /**
   * Create allowed child groups for next level.
   */
  createValueGroups() {
    const level = this.level + 1
    if (this.groupManager.allowedValues && this.groupManager.allowedValues[level]) {
      this.groupManager.allowedValues[level].forEach((value) => {
        this._createGroup(value, level)
      })
    }
  }

  /**
   * Add click bindings for group toggle behavior.
   */
  addBindings() {
    let toggleElement

    if (this.groupManager.table.options.groupToggleElement) {
      toggleElement = this.groupManager.table.options.groupToggleElement === 'arrow' ? this.arrowElement : this.element

      toggleElement.addEventListener('click', (e) => {
        if (this.groupManager.table.options.groupToggleElement === 'arrow') {
          e.stopPropagation()
          e.stopImmediatePropagation()
        }

        // allow click event to propagate before toggling visibility
        setTimeout(() => {
          this.toggleVisibility()
        })
      })
    }
  }

  /**
   * Create a child group.
   * @param {*} groupID Group key.
   * @param {number} level Group level.
   */
  _createGroup(groupID, level) {
    const groupKey = `${level}_${groupID}`
    const group = new Group(
      this.groupManager,
      this,
      level,
      groupID,
      this.groupManager.groupIDLookups[level].field,
      this.groupManager.headerGenerator[level] || this.groupManager.headerGenerator[0],
      this.old ? this.old.groups[groupKey] : false
    )

    this.groups[groupKey] = group
    this.groupList.push(group)
  }

  /**
   * Add row into nested child groups.
   * @param {object} row Internal row.
   */
  _addRowToGroup(row) {
    const level = this.level + 1

    if (this.hasSubGroups) {
      const groupID = this.groupManager.groupIDLookups[level].func(row.getData())
      const groupKey = `${level}_${groupID}`

      if (this.groupManager.allowedValues && this.groupManager.allowedValues[level]) {
        if (this.groups[groupKey]) {
          this.groups[groupKey].addRow(row)
        }
      } else {
        if (!this.groups[groupKey]) {
          this._createGroup(groupID, level)
        }

        this.groups[groupKey].addRow(row)
      }
    }
  }

  /**
   * Add row to this leaf group.
   * @param {object} row Internal row.
   */
  _addRow(row) {
    this.rows.push(row)
    row.modules.group = this
  }

  /**
   * Insert row relative to another row in this group.
   * @param {object} row Row to insert.
   * @param {object} to Target row.
   * @param {boolean} after Insert-after flag.
   */
  insertRow(row, to, after) {
    const data = this.conformRowData({})

    row.updateData(data)

    const toIndex = this.rows.indexOf(to)

    if (toIndex > -1) {
      if (after) {
        this.rows.splice(toIndex + 1, 0, row)
      } else {
        this.rows.splice(toIndex, 0, row)
      }
    } else {
      if (after) {
        this.rows.push(row)
      } else {
        this.rows.unshift(row)
      }
    }

    row.modules.group = this

    // this.generateGroupHeaderContents();

    if (this.groupManager.table.modExists('columnCalcs') && this.groupManager.table.options.columnCalcs !== 'table') {
      this.groupManager.table.modules.columnCalcs.recalcGroup(this)
    }

    this.groupManager.updateGroupRows(true)
  }

  /**
   * Sync group header horizontal offset.
   * @param {string} left Left offset CSS value.
   */
  scrollHeader(left) {
    if (this.arrowElement) {
      this.arrowElement.style.marginLeft = left

      this.groupList.forEach((child) => {
        child.scrollHeader(left)
      })
    }
  }

  /**
   * Placeholder row index lookup.
   */
  getRowIndex() {}

  // update row data to match grouping constraints
  /**
   * Conform row data to current group path.
   * @param {object} data Row data.
   * @returns {object}
   */
  conformRowData(data) {
    if (this.field) {
      data[this.field] = this.key
    } else {
      console.warn('Data Conforming Error - Cannot conform row data to match new group as groupBy is a function')
    }

    if (this.parent) {
      data = this.parent.conformRowData(data)
    }

    return data
  }

  /**
   * Remove a row from group.
   * @param {object} row Internal row.
   */
  removeRow(row) {
    const index = this.rows.indexOf(row)
    const el = row.getElement()

    if (index > -1) {
      this.rows.splice(index, 1)
    }

    if (!this.groupManager.table.options.groupValues && !this.rows.length) {
      if (this.parent) {
        this.parent.removeGroup(this)
      } else {
        this.groupManager.removeGroup(this)
      }

      this.groupManager.updateGroupRows(true)
    } else {
      if (el.parentNode) {
        el.parentNode.removeChild(el)
      }

      if (!this.groupManager.blockRedraw) {
        this.generateGroupHeaderContents()

        if (
          this.groupManager.table.modExists('columnCalcs') &&
          this.groupManager.table.options.columnCalcs !== 'table'
        ) {
          this.groupManager.table.modules.columnCalcs.recalcGroup(this)
        }
      }
    }
  }

  /**
   * Remove a child group from this group.
   * @param {Group} group Child group.
   */
  removeGroup(group) {
    const groupKey = `${group.level}_${group.key}`

    let index

    if (this.groups[groupKey]) {
      delete this.groups[groupKey]

      index = this.groupList.indexOf(group)

      if (index > -1) {
        this.groupList.splice(index, 1)
      }

      if (!this.groupList.length) {
        if (this.parent) {
          this.parent.removeGroup(this)
        } else {
          this.groupManager.removeGroup(this)
        }
      }
    }
  }

  /**
   * Get flattened headers and rows for rendering.
   * @returns {Array<object>}
   */
  getHeadersAndRows() {
    let output = []

    output.push(this)

    this._visSet()

    if (this.calcs.top) {
      this.calcs.top.detachElement()
      this.calcs.top.deleteCells()
    }

    if (this.calcs.bottom) {
      this.calcs.bottom.detachElement()
      this.calcs.bottom.deleteCells()
    }

    if (this.visible) {
      if (this.groupList.length) {
        this.groupList.forEach(function (group) {
          output = output.concat(group.getHeadersAndRows())
        })
      } else {
        if (
          this.groupManager.table.options.columnCalcs !== 'table' &&
          this.groupManager.table.modExists('columnCalcs') &&
          this.groupManager.table.modules.columnCalcs.hasTopCalcs()
        ) {
          this.calcs.top = this.groupManager.table.modules.columnCalcs.generateTopRow(this.rows)
          output.push(this.calcs.top)
        }

        output = output.concat(this.rows)

        if (
          this.groupManager.table.options.columnCalcs !== 'table' &&
          this.groupManager.table.modExists('columnCalcs') &&
          this.groupManager.table.modules.columnCalcs.hasBottomCalcs()
        ) {
          this.calcs.bottom = this.groupManager.table.modules.columnCalcs.generateBottomRow(this.rows)
          output.push(this.calcs.bottom)
        }
      }
    } else {
      if (!this.groupList.length && this.groupManager.table.options.columnCalcs !== 'table') {
        if (this.groupManager.table.modExists('columnCalcs')) {
          if (this.groupManager.table.modules.columnCalcs.hasTopCalcs()) {
            if (this.groupManager.table.options.groupClosedShowCalcs) {
              this.calcs.top = this.groupManager.table.modules.columnCalcs.generateTopRow(this.rows)
              output.push(this.calcs.top)
            }
          }

          if (this.groupManager.table.modules.columnCalcs.hasBottomCalcs()) {
            if (this.groupManager.table.options.groupClosedShowCalcs) {
              this.calcs.bottom = this.groupManager.table.modules.columnCalcs.generateBottomRow(this.rows)
              output.push(this.calcs.bottom)
            }
          }
        }
      }
    }

    return output
  }

  /**
   * Get group row data.
   * @param {boolean} [visible] Restrict to visible.
   * @param {string} [transform] Transform mode.
   * @returns {Array<object>}
   */
  getData(visible, transform) {
    const output = []

    this._visSet()

    if (!visible || (visible && this.visible)) {
      this.rows.forEach((row) => {
        output.push(row.getData(transform || 'data'))
      })
    }

    return output
  }

  /**
   * Get recursive row count for this group.
   * @returns {number}
   */
  getRowCount() {
    let count = 0

    if (this.groupList.length) {
      this.groupList.forEach((group) => {
        count += group.getRowCount()
      })
    } else {
      count = this.rows.length
    }
    return count
  }

  /**
   * Toggle group visibility.
   */
  toggleVisibility() {
    if (this.visible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * Hide group rows.
   */
  hide() {
    this.visible = false

    if (this.groupManager.table.rowManager.getRenderMode() === 'basic' && !this.groupManager.table.options.pagination) {
      this.element.classList.remove('tabulator-group-visible')

      if (this.groupList.length) {
        this.groupList.forEach((group) => {
          const rows = group.getHeadersAndRows()

          rows.forEach((row) => {
            row.detachElement()
          })
        })
      } else {
        this.rows.forEach((row) => {
          const rowEl = row.getElement()

          if (rowEl.parentNode) {
            rowEl.parentNode.removeChild(rowEl)
          }
        })
      }
    }

    this.groupManager.updateGroupRows(true)

    this.groupManager.table.externalEvents.dispatch('groupVisibilityChanged', this.getComponent(), false)
  }

  /**
   * Show group rows.
   */
  show() {
    this.visible = true

    if (this.groupManager.table.rowManager.getRenderMode() === 'basic' && !this.groupManager.table.options.pagination) {
      this.element.classList.add('tabulator-group-visible')

      let prev = this.generateElement()

      if (this.groupList.length) {
        this.groupList.forEach((group) => {
          const rows = group.getHeadersAndRows()

          rows.forEach((row) => {
            const rowEl = row.getElement()
            prev.parentNode.insertBefore(rowEl, prev.nextSibling)
            row.initialize()
            prev = rowEl
          })
        })
      } else {
        this.rows.forEach((row) => {
          const rowEl = row.getElement()
          prev.parentNode.insertBefore(rowEl, prev.nextSibling)
          row.initialize()
          prev = rowEl
        })
      }
    }

    this.groupManager.updateGroupRows(true)

    this.groupManager.table.externalEvents.dispatch('groupVisibilityChanged', this.getComponent(), true)
  }

  /**
   * Resolve dynamic visibility callback values.
   */
  _visSet() {
    const data = []

    if (typeof this.visible === 'function') {
      this.rows.forEach((row) => {
        data.push(row.getData())
      })

      this.visible = this.visible(this.key, this.getRowCount(), data, this.getComponent())
    }
  }

  /**
   * Find nested group containing a row.
   * @param {object} row Internal row.
   * @returns {Group|boolean}
   */
  getRowGroup(row) {
    let match = false
    if (this.groupList.length) {
      this.groupList.forEach((group) => {
        const result = group.getRowGroup(row)

        if (result) {
          match = result
        }
      })
    } else {
      if (this.rows.find((item) => item === row)) {
        match = this
      }
    }

    return match
  }

  /**
   * Get direct child groups.
   * @param {boolean} component Return components.
   * @returns {Array<object>}
   */
  getSubGroups(component) {
    const output = []

    this.groupList.forEach((child) => {
      output.push(component ? child.getComponent() : child)
    })

    return output
  }

  /**
   * Get rows from this group.
   * @param {boolean} component Return row components.
   * @param {boolean} includeChildren Include child rows recursively.
   * @returns {Array<object>}
   */
  getRows(component, includeChildren) {
    let output = []

    if (includeChildren && this.groupList.length) {
      this.groupList.forEach((group) => {
        output = output.concat(group.getRows(component, includeChildren))
      })
    } else {
      this.rows.forEach((row) => {
        output.push(component ? row.getComponent() : row)
      })
    }

    return output
  }

  /**
   * Generate group header content.
   */
  generateGroupHeaderContents() {
    const data = []

    const rows = this.getRows(false, true)

    rows.forEach((row) => {
      data.push(row.getData())
    })

    this.elementContents = this.generator(this.key, this.getRowCount(), data, this.getComponent())

    while (this.element.firstChild) this.element.removeChild(this.element.firstChild)

    if (typeof this.elementContents === 'string') {
      this.element.innerHTML = this.elementContents
    } else {
      this.element.appendChild(this.elementContents)
    }

    this.element.insertBefore(this.arrowElement, this.element.firstChild)
  }

  /**
   * Get group key path from root to this group.
   * @param {Array<*>} [path=[]] Existing path.
   * @returns {Array<*>}
   */
  getPath(path = []) {
    path.unshift(this.key)
    if (this.parent) {
      this.parent.getPath(path)
    }
    return path
  }

  /// /////////// Standard Row Functions //////////////

  /**
   * Get group header element.
   * @returns {HTMLElement}
   */
  getElement() {
    return this.elementContents ? this.element : this.generateElement()
  }

  /**
   * Generate and return group header element.
   * @returns {HTMLElement}
   */
  generateElement() {
    this.addBindings = false

    this._visSet()

    if (this.visible) {
      this.element.classList.add('tabulator-group-visible')
    } else {
      this.element.classList.remove('tabulator-group-visible')
    }

    for (let i = 0; i < this.element.childNodes.length; ++i) {
      this.element.childNodes[i].parentNode.removeChild(this.element.childNodes[i])
    }

    this.generateGroupHeaderContents()

    // this.addBindings();

    return this.element
  }

  /**
   * Detach group element from DOM.
   */
  detachElement() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }
  }

  // normalize the height of elements in the row
  /**
   * Normalize cached height values.
   */
  normalizeHeight() {
    this.setHeight(this.element.clientHeight)
  }

  /**
   * Initialize group size state.
   * @param {boolean} [force] Force reinitialize.
   */
  initialize(force) {
    if (!this.initialized || force) {
      this.normalizeHeight()
      this.initialized = true
    }
  }

  /**
   * Reinitialize group height state.
   */
  reinitialize() {
    this.initialized = false
    this.height = 0

    if (Helpers.elVisible(this.element)) {
      this.initialize(true)
    }
  }

  /**
   * Set group height cache.
   * @param {number} height Height in px.
   */
  setHeight(height) {
    if (this.height !== height) {
      this.height = height
      this.outerHeight = this.element.offsetHeight
    }
  }

  // return rows outer height
  /**
   * Get outer rendered height.
   * @returns {number}
   */
  getHeight() {
    return this.outerHeight
  }

  /**
   * Get this group instance.
   * @returns {Group}
   */
  getGroup() {
    return this
  }

  reinitializeHeight() {}

  calcHeight() {}

  setCellHeight() {}

  clearCellHeight() {}

  deinitializeHeight() {}

  rendered() {}

  /// ///////////// Object Generation /////////////////
  /**
   * Get group component wrapper.
   * @returns {GroupComponent}
   */
  getComponent() {
    if (!this.component) {
      this.component = new GroupComponent(this)
    }

    return this.component
  }
}
