import Module from '../../core/Module.js'

import Group from './Group.js'

export default class GroupRows extends Module {
  static moduleName = 'groupRows'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.groupIDLookups = false // enable table grouping and set field to group by
    this.startOpen = [
      function () {
        return false
      }
    ] // starting state of group
    this.headerGenerator = [
      function () {
        return ''
      }
    ]
    this.groupList = [] // ordered list of groups
    this.allowedValues = false
    this.groups = {} // hold row groups

    this.displayHandler = this.getRows.bind(this)

    this.blockRedraw = false

    // register table options
    this.registerTableOption('groupBy', false) // enable table grouping and set field to group by
    this.registerTableOption('groupStartOpen', true) // starting state of group
    this.registerTableOption('groupValues', false)
    this.registerTableOption('groupUpdateOnCellEdit', false)
    this.registerTableOption('groupHeader', false) // header generation function
    this.registerTableOption('groupHeaderPrint', null)
    this.registerTableOption('groupHeaderClipboard', null)
    this.registerTableOption('groupHeaderHtmlOutput', null)
    this.registerTableOption('groupHeaderDownload', null)
    this.registerTableOption('groupToggleElement', 'arrow')
    this.registerTableOption('groupClosedShowCalcs', false)

    // register table functions
    this.registerTableFunction('setGroupBy', this.setGroupBy.bind(this))
    this.registerTableFunction('setGroupValues', this.setGroupValues.bind(this))
    this.registerTableFunction('setGroupStartOpen', this.setGroupStartOpen.bind(this))
    this.registerTableFunction('setGroupHeader', this.setGroupHeader.bind(this))
    this.registerTableFunction('getGroups', this.userGetGroups.bind(this))
    this.registerTableFunction('getGroupedData', this.userGetGroupedData.bind(this))

    // register component functions
    this.registerComponentFunction('row', 'getGroup', this.rowGetGroup.bind(this))
  }

  // initialize group configuration
  /**
   * Initialize grouping subscriptions and handlers.
   */
  initialize() {
    this.subscribe('table-destroy', this._blockRedrawing.bind(this))
    this.subscribe('rows-wipe', this._blockRedrawing.bind(this))
    this.subscribe('rows-wiped', this._restoreRedrawing.bind(this))

    if (this.table.options.groupBy) {
      if (this.table.options.groupUpdateOnCellEdit) {
        this.subscribe('cell-value-updated', this.cellUpdated.bind(this))
        this.subscribe('row-data-changed', this.reassignRowToGroup.bind(this), 0)
      }

      this.subscribe('table-built', this.configureGroupSetup.bind(this))

      this.subscribe('row-deleting', this.rowDeleting.bind(this))
      this.subscribe('row-deleted', this.rowsUpdated.bind(this))
      this.subscribe('scroll-horizontal', this.scrollHeaders.bind(this))
      this.subscribe('rows-wipe', this.wipe.bind(this))
      this.subscribe('rows-added', this.rowsUpdated.bind(this))
      this.subscribe('row-moving', this.rowMoving.bind(this))
      this.subscribe('row-adding-index', this.rowAddingIndex.bind(this))

      this.subscribe('rows-sample', this.rowSample.bind(this))

      this.subscribe('render-virtual-fill', this.virtualRenderFill.bind(this))

      this.registerDisplayHandler(this.displayHandler, 20)

      this.initialized = true
    }
  }

  /**
   * Temporarily block grouped redraw output generation.
   */
  _blockRedrawing() {
    this.blockRedraw = true
  }

  /**
   * Restore grouped redraw output generation.
   */
  _restoreRedrawing() {
    this.blockRedraw = false
  }

  /**
   * Build group lookup/generator configuration from table options.
   */
  configureGroupSetup() {
    if (this.table.options.groupBy) {
      let groupBy = this.table.options.groupBy
      let startOpen = this.table.options.groupStartOpen
      const groupHeader = this.table.options.groupHeader

      this.allowedValues = this.table.options.groupValues

      if (Array.isArray(groupBy) && Array.isArray(groupHeader) && groupBy.length > groupHeader.length) {
        console.warn('Error creating group headers, groupHeader array is shorter than groupBy array')
      }

      this.headerGenerator = [
        function () {
          return ''
        }
      ]
      this.startOpen = [
        function () {
          return false
        }
      ] // starting state of group

      this.langBind('groups|item', (langValue, lang) => {
        this.headerGenerator[0] = (value, count) => {
          // header layout function
          return (
            (value === undefined ? '' : value) +
            '<span>(' +
            count +
            ' ' +
            (count === 1 ? langValue : lang.groups.items) +
            ')</span>'
          )
        }
      })

      this.groupIDLookups = []

      if (groupBy) {
        if (
          this.table.modExists('columnCalcs') &&
          this.table.options.columnCalcs !== 'table' &&
          this.table.options.columnCalcs !== 'both'
        ) {
          this.table.modules.columnCalcs.removeCalcs()
        }
      } else {
        if (this.table.modExists('columnCalcs') && this.table.options.columnCalcs !== 'group') {
          const cols = this.table.columnManager.getRealColumns()

          cols.forEach((col) => {
            if (col.definition.topCalc) {
              this.table.modules.columnCalcs.initializeTopRow()
            }

            if (col.definition.bottomCalc) {
              this.table.modules.columnCalcs.initializeBottomRow()
            }
          })
        }
      }

      if (!Array.isArray(groupBy)) {
        groupBy = [groupBy]
      }

      groupBy.forEach((group, i) => {
        let lookupFunc, column

        if (typeof group === 'function') {
          lookupFunc = group
        } else {
          column = this.table.columnManager.getColumnByField(group)

          if (column) {
            lookupFunc = (data) => column.getFieldValue(data)
          } else {
            lookupFunc = (data) => data[group]
          }
        }

        this.groupIDLookups.push({
          field: typeof group === 'function' ? false : group,
          func: lookupFunc,
          values: this.allowedValues ? this.allowedValues[i] : false
        })
      })

      if (startOpen) {
        if (!Array.isArray(startOpen)) {
          startOpen = [startOpen]
        }

        startOpen = startOpen.map((level) => (typeof level === 'function' ? level : () => true))

        this.startOpen = startOpen
      }

      if (groupHeader) {
        this.headerGenerator = Array.isArray(groupHeader) ? groupHeader : [groupHeader]
      }
    } else {
      this.groupList = []
      this.groups = {}
    }
  }

  /**
   * Add a grouped sample row to sample output.
   * @param {Array<object>} rows Sample rows.
   * @param {Array<object>} prevValue Existing samples.
   * @returns {Array<object>}
   */
  rowSample(rows, prevValue) {
    if (this.table.options.groupBy) {
      const group = this.getGroups(false)[0]

      if (group) {
        const groupRows = group.getRows(false)

        if (groupRows.length) {
          prevValue.push(groupRows[0])
        }
      }
    }

    return prevValue
  }

  /**
   * Adjust virtual render width when only group headers are visible.
   * @returns {Array<object>|undefined}
   */
  virtualRenderFill() {
    const el = this.table.rowManager.tableElement

    let rows = this.table.rowManager.getVisibleRows()

    if (this.table.options.groupBy) {
      rows = rows.filter((row) => row.type !== 'group')

      el.style.minWidth = !rows.length ? `${this.table.columnManager.getWidth()}px` : ''
    } else {
      return rows
    }
  }

  /**
   * Resolve insertion index within grouped rows.
   * @param {object} row Internal row.
   * @param {object} index Target index row.
   * @param {boolean} top Insert-at-top flag.
   * @returns {object|undefined}
   */
  rowAddingIndex(row, index, top) {
    if (this.table.options.groupBy) {
      this.assignRowToGroup(row)

      const groupRows = row.modules.group.rows

      if (groupRows.length > 1) {
        if (!index || (index && !groupRows.includes(index))) {
          if (top) {
            if (groupRows[0] !== row) {
              index = groupRows[0]
              this.table.rowManager.moveRowInArray(row.modules.group.rows, row, index, !top)
            }
          } else {
            if (groupRows[groupRows.length - 1] !== row) {
              index = groupRows[groupRows.length - 1]
              this.table.rowManager.moveRowInArray(row.modules.group.rows, row, index, !top)
            }
          }
        } else {
          this.table.rowManager.moveRowInArray(row.modules.group.rows, row, index, !top)
        }
      }

      return index
    }
  }

  /**
   * Emit grouped data change event.
   */
  trackChanges() {
    this.dispatch('group-changed')
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////

  /**
   * Set grouping definition.
   * @param {*} groups Group definition.
   */
  setGroupBy(groups) {
    this.table.options.groupBy = groups

    if (!this.initialized) {
      this.initialize()
    }

    this.configureGroupSetup()

    if (!groups && this.table.modExists('columnCalcs') && this.table.options.columnCalcs === true) {
      this.table.modules.columnCalcs.reinitializeCalcs()
    }

    this.refreshData()

    this.trackChanges()
  }

  /**
   * Set allowed group values.
   * @param {*} groupValues Group values config.
   */
  setGroupValues(groupValues) {
    this.table.options.groupValues = groupValues
    this.configureGroupSetup()
    this.refreshData()

    this.trackChanges()
  }

  /**
   * Set initial open/closed state rules for groups.
   * @param {*} values Open-state config.
   */
  setGroupStartOpen(values) {
    this.table.options.groupStartOpen = values
    this.configureGroupSetup()

    if (this.table.options.groupBy) {
      this.refreshData()

      this.trackChanges()
    } else {
      console.warn('Grouping Update - cant refresh view, no groups have been set')
    }
  }

  /**
   * Set group header generator config.
   * @param {*} values Group header config.
   */
  setGroupHeader(values) {
    this.table.options.groupHeader = values
    this.configureGroupSetup()

    if (this.table.options.groupBy) {
      this.refreshData()

      this.trackChanges()
    } else {
      console.warn('Grouping Update - cant refresh view, no groups have been set')
    }
  }

  /**
   * Get top-level groups as components.
   * @returns {Array<object>}
   */
  userGetGroups() {
    return this.getGroups(true)
  }

  // get grouped table data in the same format as getData()
  /**
   * Get grouped data payload.
   * @returns {Array<object>}
   */
  userGetGroupedData() {
    return this.table.options.groupBy ? this.getGroupedData() : this.getData()
  }

  /// ////////////////////////////////////
  /// ////// Component Functions /////////
  /// ////////////////////////////////////

  /**
   * Get row's group component.
   * @param {object} row Internal row.
   * @returns {object|boolean}
   */
  rowGetGroup(row) {
    return row.modules.group ? row.modules.group.getComponent() : false
  }

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Handle row move operations within/across groups.
   * @param {object} from Source row/group.
   * @param {object} to Target row/group.
   * @param {boolean} after Insert-after flag.
   */
  rowMoving(from, to, after) {
    if (this.table.options.groupBy) {
      if (!after && to instanceof Group) {
        to = this.table.rowManager.prevDisplayRow(from) || to
      }

      const toGroup = to instanceof Group ? to : to.modules.group
      const fromGroup = from instanceof Group ? from : from.modules.group

      if (toGroup === fromGroup) {
        this.table.rowManager.moveRowInArray(toGroup.rows, from, to, after)
      } else {
        if (fromGroup) {
          fromGroup.removeRow(from)
        }

        toGroup.insertRow(from, to, after)
      }
    }
  }

  /**
   * Remove row from its group before deletion.
   * @param {object} row Internal row.
   */
  rowDeleting(row) {
    // remove from group
    if (this.table.options.groupBy && row.modules.group) {
      row.modules.group.removeRow(row)
    }
  }

  /**
   * Refresh grouped rows after row updates.
   */
  rowsUpdated() {
    if (this.table.options.groupBy) {
      this.updateGroupRows(true)
    }
  }

  /**
   * Reassign row when grouped field values change.
   * @param {object} cell Updated cell.
   */
  cellUpdated(cell) {
    if (this.table.options.groupBy) {
      this.reassignRowToGroup(cell.row)
    }
  }

  // return appropriate rows with group headers
  /**
   * Build grouped display rows.
   * @param {Array<object>} rows Source rows.
   * @returns {Array<object>}
   */
  getRows(rows) {
    if (this.table.options.groupBy && this.groupIDLookups.length) {
      this.dispatchExternal('dataGrouping')

      this.generateGroups(rows)

      if (this.subscribedExternal('dataGrouped')) {
        this.dispatchExternal('dataGrouped', this.getGroups(true))
      }

      return this.updateGroupRows()
    } else {
      return rows.slice(0)
    }
  }

  /**
   * Get groups list.
   * @param {boolean} component Return components when true.
   * @returns {Array<object>}
   */
  getGroups(component) {
    const groupComponents = []

    this.groupList.forEach((group) => {
      groupComponents.push(component ? group.getComponent() : group)
    })

    return groupComponents
  }

  /**
   * Get leaf child groups recursively.
   * @param {object} [group] Group container.
   * @returns {Array<object>}
   */
  getChildGroups(group) {
    let groupComponents = []

    if (!group) {
      group = this
    }

    group.groupList.forEach((child) => {
      if (child.groupList.length) {
        groupComponents = groupComponents.concat(this.getChildGroups(child))
      } else {
        groupComponents.push(child)
      }
    })

    return groupComponents
  }

  /**
   * Clear all group state.
   */
  wipe() {
    if (this.table.options.groupBy) {
      this.groupList.forEach((group) => {
        group.wipe()
      })

      this.groupList = []
      this.groups = {}
    }
  }

  /**
   * Convert group list to grouped data output.
   * @param {Array<object>} groupList Internal groups.
   * @returns {Array<object>}
   */
  pullGroupListData(groupList) {
    let groupListData = []

    groupList.forEach((group) => {
      const groupHeader = {}
      groupHeader.level = 0
      groupHeader.rowCount = 0
      groupHeader.headerContent = ''
      let childData

      if (group.hasSubGroups) {
        childData = this.pullGroupListData(group.groupList)

        groupHeader.level = group.level
        groupHeader.rowCount = childData.length - group.groupList.length // data length minus number of sub-headers
        groupHeader.headerContent = group.generator(group.key, groupHeader.rowCount, group.rows, group)

        groupListData.push(groupHeader)
        groupListData = groupListData.concat(childData)
      } else {
        groupHeader.level = group.level
        groupHeader.headerContent = group.generator(group.key, group.rows.length, group.rows, group)
        groupHeader.rowCount = group.getRows().length

        groupListData.push(groupHeader)

        group.getRows().forEach((row) => {
          groupListData.push(row.getData('data'))
        })
      }
    })

    return groupListData
  }

  /**
   * Get grouped data tree.
   * @returns {Array<object>}
   */
  getGroupedData() {
    return this.pullGroupListData(this.groupList)
  }

  /**
   * Find group that contains a row.
   * @param {object} row Internal row.
   * @returns {object|boolean}
   */
  getRowGroup(row) {
    let match = false

    if (this.options('dataTree')) {
      row = this.table.modules.dataTree.getTreeParentRoot(row)
    }

    this.groupList.forEach((group) => {
      const result = group.getRowGroup(row)

      if (result) {
        match = result
      }
    })

    return match
  }

  /**
   * Count top-level groups.
   * @returns {number}
   */
  countGroups() {
    return this.groupList.length
  }

  /**
   * Generate groups and assign rows.
   * @param {Array<object>} rows Source rows.
   */
  generateGroups(rows) {
    const oldGroups = this.groups

    this.groups = {}
    this.groupList = []

    if (this.allowedValues && this.allowedValues[0]) {
      this.allowedValues[0].forEach((value) => {
        this.createGroup(value, 0, oldGroups)
      })

      rows.forEach((row) => {
        this.assignRowToExistingGroup(row)
      })
    } else {
      rows.forEach((row) => {
        this.assignRowToGroup(row, oldGroups)
      })
    }

    Object.values(oldGroups).forEach((group) => {
      group.wipe(true)
    })
  }

  /**
   * Create a top-level group.
   * @param {*} groupID Group key.
   * @param {number} level Group level.
   * @param {object} oldGroups Previous group map.
   */
  createGroup(groupID, level, oldGroups) {
    const groupKey = `${level}_${groupID}`

    let group

    oldGroups = oldGroups || []

    group = new Group(
      this,
      false,
      level,
      groupID,
      this.groupIDLookups[0].field,
      this.headerGenerator[0],
      oldGroups[groupKey]
    )

    this.groups[groupKey] = group
    this.groupList.push(group)
  }

  /**
   * Assign row to an existing pre-created group.
   * @param {object} row Internal row.
   */
  assignRowToExistingGroup(row) {
    const groupID = this.groupIDLookups[0].func(row.getData())
    const groupKey = `0_${groupID}`

    if (this.groups[groupKey]) {
      this.groups[groupKey].addRow(row)
    }
  }

  /**
   * Assign row to a group, creating one if needed.
   * @param {object} row Internal row.
   * @param {object} oldGroups Previous group map.
   * @returns {boolean}
   */
  assignRowToGroup(row, oldGroups) {
    const groupID = this.groupIDLookups[0].func(row.getData())
    const groupKey = `0_${groupID}`
    const newGroupNeeded = !this.groups[groupKey]

    if (newGroupNeeded) {
      this.createGroup(groupID, 0, oldGroups)
    }

    this.groups[groupKey].addRow(row)

    return !newGroupNeeded
  }

  /**
   * Move row to correct group when grouping values change.
   * @param {object} row Internal row.
   */
  reassignRowToGroup(row) {
    if (row.type === 'row') {
      const oldRowGroup = row.modules.group
      const oldGroupPath = oldRowGroup.getPath()
      const newGroupPath = this.getExpectedPath(row)

      let samePath

      // figure out if new group path is the same as old group path
      samePath =
        oldGroupPath.length === newGroupPath.length &&
        oldGroupPath.every((element, index) => element === newGroupPath[index])

      // refresh if they new path and old path aren't the same (aka the row's groupings have changed)
      if (!samePath) {
        oldRowGroup.removeRow(row)
        this.assignRowToGroup(row, this.groups)
        this.refreshData(true)
      }
    }
  }

  /**
   * Compute expected group key path for a row.
   * @param {object} row Internal row.
   * @returns {Array<*>}
   */
  getExpectedPath(row) {
    const groupPath = []
    const rowData = row.getData()

    this.groupIDLookups.forEach((groupId) => {
      groupPath.push(groupId.func(rowData))
    })

    return groupPath
  }

  /**
   * Build flattened grouped header/row display list.
   * @param {boolean} force Trigger refresh after build.
   * @returns {Array<object>}
   */
  updateGroupRows(force) {
    let output = []

    if (!this.blockRedraw) {
      this.groupList.forEach((group) => {
        output = output.concat(group.getHeadersAndRows())
      })

      if (force) {
        this.refreshData(true)
      }
    }

    return output
  }

  /**
   * Sync grouped header horizontal positions.
   * @param {number} left Horizontal scroll offset.
   */
  scrollHeaders(left) {
    if (this.table.options.groupBy) {
      if (this.table.options.renderHorizontal === 'virtual') {
        left -= this.table.columnManager.renderer.vDomPadLeft
      }

      left = `${left}px`

      this.groupList.forEach((group) => {
        group.scrollHeader(left)
      })
    }
  }

  /**
   * Remove a group from registry and list.
   * @param {object} group Internal group.
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
    }
  }

  /**
   * Ensure table width when only group headers render.
   */
  checkBasicModeGroupHeaderWidth() {
    const element = this.table.rowManager.tableElement

    let onlyGroupHeaders = true

    this.table.rowManager.getDisplayRows().forEach((row, index) => {
      this.table.rowManager.styleRow(row, index)
      element.appendChild(row.getElement())
      row.initialize(true)

      if (row.type !== 'group') {
        onlyGroupHeaders = false
      }
    })

    if (onlyGroupHeaders) {
      element.style.minWidth = `${this.table.columnManager.getWidth()}px`
    } else {
      element.style.minWidth = ''
    }
  }
}
