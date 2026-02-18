import Module from '../../core/Module.js'

import defaultModes from './defaults/modes.js'

export default class Layout extends Module {
  static moduleName = 'layout'

  // load defaults
  static modes = defaultModes

  constructor(table) {
    super(table, 'layout')

    this.mode = null

    this.registerTableOption('layout', 'fitData') // layout type
    this.registerTableOption('layoutColumnsOnNewData', false) // update column widths on setData

    this.registerColumnOption('widthGrow')
    this.registerColumnOption('widthShrink')
  }

  // initialize layout system
  initialize() {
    const layout = this.table.options.layout
    const modeExists = Boolean(Layout.modes[layout])

    this.mode = modeExists ? layout : 'fitData'

    if (!modeExists) {
      console.warn(`Layout Error - invalid mode set, defaulting to 'fitData' : ${layout}`)
    }

    this.table.element.setAttribute('tabulator-layout', this.mode)
    this.subscribe('column-init', this.initializeColumn.bind(this))
  }

  initializeColumn(column) {
    if (column.definition.widthGrow) {
      column.definition.widthGrow = Number(column.definition.widthGrow)
    }
    if (column.definition.widthShrink) {
      column.definition.widthShrink = Number(column.definition.widthShrink)
    }
  }

  getMode() {
    return this.mode
  }

  // trigger table layout
  layout(dataChanged) {
    const hasVariableHeightColumns = this.table.columnManager.columnsByIndex.find(
      (column) => column.definition.variableHeight || column.definition.formatter === 'textarea'
    )

    this.dispatch('layout-refreshing')
    Layout.modes[this.mode].call(this, this.table.columnManager.columnsByIndex, dataChanged)

    if (hasVariableHeightColumns) {
      this.table.rowManager.normalizeHeight(true)
    }

    this.dispatch('layout-refreshed')
  }
}
