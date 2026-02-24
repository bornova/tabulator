import Module from '../../core/Module.js'

import defaultModes from './defaults/modes.js'

export default class Layout extends Module {
  static moduleName = 'layout'

  // load defaults
  static modes = defaultModes

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table, 'layout')

    this.mode = null

    this.registerTableOption('layout', 'fitData') // layout type
    this.registerTableOption('layoutColumnsOnNewData', false) // update column widths on setData

    this.registerColumnOption('widthGrow')
    this.registerColumnOption('widthShrink')
  }

  // initialize layout system
  /**
   * Initialize the configured layout mode.
   */
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

  /**
   * Normalize column width configuration values.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    if (column.definition.widthGrow !== undefined) {
      column.definition.widthGrow = Number(column.definition.widthGrow)
    }
    if (column.definition.widthShrink !== undefined) {
      column.definition.widthShrink = Number(column.definition.widthShrink)
    }
  }

  /**
   * Get the active layout mode.
   * @returns {string|null}
   */
  getMode() {
    return this.mode
  }

  // trigger table layout
  /**
   * Run the current layout strategy.
   * @param {boolean} dataChanged Whether data has changed.
   */
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
