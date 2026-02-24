import Module from '../../core/Module.js'
import Sheet from './Sheet'
import SheetComponent from './SheetComponent'

export default class Spreadsheet extends Module {
  static moduleName = 'spreadsheet'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.sheets = []
    this.element = null

    this.registerTableOption('spreadsheet', false)
    this.registerTableOption('spreadsheetRows', 50)
    this.registerTableOption('spreadsheetColumns', 50)
    this.registerTableOption('spreadsheetColumnDefinition', {})
    this.registerTableOption('spreadsheetOutputFull', false)
    this.registerTableOption('spreadsheetData', false)
    this.registerTableOption('spreadsheetSheets', false)
    this.registerTableOption('spreadsheetSheetTabs', false)
    this.registerTableOption('spreadsheetSheetTabsElement', false)

    this.registerTableFunction('setSheets', this.setSheets.bind(this))
    this.registerTableFunction('addSheet', this.addSheet.bind(this))
    this.registerTableFunction('getSheets', this.getSheets.bind(this))
    this.registerTableFunction('getSheetDefinitions', this.getSheetDefinitions.bind(this))
    this.registerTableFunction('setSheetData', this.setSheetData.bind(this))
    this.registerTableFunction('getSheet', this.getSheet.bind(this))
    this.registerTableFunction('getSheetData', this.getSheetData.bind(this))
    this.registerTableFunction('clearSheet', this.clearSheet.bind(this))
    this.registerTableFunction('removeSheet', this.removeSheetFunc.bind(this))
    this.registerTableFunction('activeSheet', this.activeSheetFunc.bind(this))
  }

  /// ////////////////////////////////
  /// /// Module Initialization //////
  /// ////////////////////////////////

  /**
   * Initialize spreadsheet mode and related lifecycle hooks.
   * @returns {void}
   */
  initialize() {
    if (this.options('spreadsheet')) {
      this.subscribe('table-initialized', this.tableInitialized.bind(this))
      this.subscribe('data-loaded', this.loadRemoteData.bind(this))

      this.table.options.index = '_id'

      if (this.options('spreadsheetData') && this.options('spreadsheetSheets')) {
        console.warn('You cannot use spreadsheetData and spreadsheetSheets at the same time, ignoring spreadsheetData')

        this.table.options.spreadsheetData = false
      }

      this.compatibilityCheck()

      if (this.options('spreadsheetSheetTabs')) {
        this.initializeTabset()
      }
    }
  }

  /**
   * Warn about incompatible options with spreadsheet mode.
   * @returns {void}
   */
  compatibilityCheck() {
    if (this.options('data')) {
      console.warn(
        'Do not use the data option when working with spreadsheets, use either spreadsheetData or spreadsheetSheets to pass data into the table'
      )
    }

    if (this.options('pagination')) {
      console.warn('The spreadsheet module is not compatible with the pagination module')
    }

    if (this.options('groupBy')) {
      console.warn('The spreadsheet module is not compatible with the row grouping module')
    }

    if (this.options('responsiveCollapse')) {
      console.warn('The spreadsheet module is not compatible with the responsive collapse module')
    }
  }

  /**
   * Initialize sheet tab container.
   * @returns {void}
   */
  initializeTabset() {
    this.element = document.createElement('div')
    this.element.classList.add('tabulator-spreadsheet-tabs')
    let altContainer = this.options('spreadsheetSheetTabsElement')

    if (altContainer && !(altContainer instanceof HTMLElement)) {
      altContainer = document.querySelector(altContainer)

      if (!altContainer) {
        console.warn(
          'Unable to find element matching spreadsheetSheetTabsElement selector:',
          this.options('spreadsheetSheetTabsElement')
        )
      }
    }

    if (altContainer) {
      altContainer.appendChild(this.element)
    } else {
      this.footerAppend(this.element)
    }
  }

  /**
   * Load initial spreadsheet data/sheets after table initialization.
   * @returns {void}
   */
  tableInitialized() {
    if (this.sheets.length) {
      this.loadSheet(this.sheets[0])
      return
    }

    if (this.options('spreadsheetSheets')) {
      this.loadSheets(this.options('spreadsheetSheets'))
    } else if (this.options('spreadsheetData')) {
      this.loadData(this.options('spreadsheetData'))
    }
  }

  /// ////////////////////////////////
  /// //////// Ajax Parsing //////////
  /// ////////////////////////////////

  /**
   * Parse remote payload for spreadsheet data.
   * @param {Array<*>} data Remote data payload.
   * @returns {boolean}
   */
  loadRemoteData(data) {
    if (Array.isArray(data)) {
      this.table.dataLoader.clearAlert()
      this.dispatchExternal('dataLoaded', data)

      if (!data.length || Array.isArray(data[0])) {
        this.loadData(data)
      } else {
        this.loadSheets(data)
      }
    } else {
      console.error(
        'Spreadsheet Loading Error - Unable to process remote data due to invalid data type \nExpecting: array \nReceived: ',
        typeof data,
        '\nData:     ',
        data
      )
    }

    return false
  }

  /// ////////////////////////////////
  /// ////// Sheet Management ////////
  /// ////////////////////////////////

  /**
   * Load a single-sheet data matrix.
   * @param {Array<*>} data Spreadsheet data matrix.
   * @returns {void}
   */
  loadData(data) {
    const def = {
      data
    }

    this.loadSheet(this.newSheet(def))
  }

  /**
   * Destroy all sheet instances.
   * @returns {void}
   */
  destroySheets() {
    this.sheets.forEach((sheet) => {
      sheet.destroy()
    })

    this.sheets = []
    this.activeSheet = null
  }

  /**
   * Load and initialize multiple sheet definitions.
   * @param {Array<object>} sheets Sheet definitions.
   * @returns {void}
   */
  loadSheets(sheets) {
    if (!Array.isArray(sheets)) {
      sheets = []
    }

    this.destroySheets()

    sheets.forEach((def) => {
      this.newSheet(def)
    })

    if (this.sheets.length) {
      this.loadSheet(this.sheets[0])
    }
  }

  /**
   * Activate a sheet.
   * @param {Sheet} sheet Sheet instance.
   * @returns {void}
   */
  loadSheet(sheet) {
    if (!sheet) {
      this.activeSheet = null
      return
    }

    if (this.activeSheet !== sheet) {
      if (this.activeSheet) {
        this.activeSheet.unload()
      }

      this.activeSheet = sheet

      sheet.load()
    }
  }

  /**
   * Create a new sheet from a definition.
   * @param {object} [definition={}] Sheet definition.
   * @returns {Sheet}
   */
  newSheet(definition = {}) {
    if (!definition.rows) {
      definition.rows = this.options('spreadsheetRows')
    }

    if (!definition.columns) {
      definition.columns = this.options('spreadsheetColumns')
    }

    const sheet = new Sheet(this, definition)

    this.sheets.push(sheet)

    if (this.element) {
      this.element.appendChild(sheet.element)
    }

    return sheet
  }

  /**
   * Remove a sheet instance.
   * @param {Sheet} sheet Sheet instance.
   * @returns {void}
   */
  removeSheet(sheet) {
    const index = this.sheets.indexOf(sheet)

    if (this.sheets.length <= 1) {
      console.warn('Unable to remove sheet, at least one sheet must be active')
      return
    }

    if (index < 0) {
      return
    }

    this.sheets.splice(index, 1)
    sheet.destroy()

    if (this.activeSheet === sheet) {
      const prevSheet = this.sheets[index - 1] || this.sheets[0]

      if (prevSheet) {
        this.loadSheet(prevSheet)
      } else {
        this.activeSheet = null
      }
    }
  }

  /**
   * Resolve sheet by key/component/instance.
   * @param {*} key Sheet lookup value.
   * @returns {Sheet|boolean|null}
   */
  lookupSheet(key) {
    if (key === undefined || key === null || key === false) {
      return this.activeSheet
    } else {
      if (key instanceof Sheet) {
        return key
      }

      if (key instanceof SheetComponent) {
        return key._sheet
      }

      return this.sheets.find((sheet) => sheet.key === key) || false
    }
  }

  /// ////////////////////////////////
  /// ///// Public Functions /////////
  /// ////////////////////////////////

  /**
   * Replace all sheets with a new sheet set.
   * @param {Array<object>} sheets Sheet definitions.
   * @returns {Array<object>}
   */
  setSheets(sheets) {
    this.loadSheets(sheets)

    return this.getSheets()
  }

  /**
   * Add a new sheet definition.
   * @param {object} sheet Sheet definition.
   * @returns {object}
   */
  addSheet(sheet) {
    return this.newSheet(sheet).getComponent()
  }

  /**
   * Get definitions for all sheets.
   * @returns {Array<object>}
   */
  getSheetDefinitions() {
    return this.sheets.map((sheet) => sheet.getDefinition())
  }

  /**
   * Get all sheet components.
   * @returns {Array<object>}
   */
  getSheets() {
    return this.sheets.map((sheet) => sheet.getComponent())
  }

  /**
   * Get one sheet component.
   * @param {*} key Sheet lookup value.
   * @returns {object|boolean}
   */
  getSheet(key) {
    const sheet = this.lookupSheet(key)

    return sheet ? sheet.getComponent() : false
  }

  /**
   * Set data for a target sheet or active sheet.
   * @param {*} key Sheet key or data when omitted.
   * @param {*} data Sheet data.
   * @returns {Promise<void>|void|boolean}
   */
  setSheetData(key, data) {
    if (key && !data) {
      data = key
      key = false
    }

    const sheet = this.lookupSheet(key)

    return sheet ? sheet.setData(data) : false
  }

  /**
   * Get data for a target sheet.
   * @param {*} key Sheet lookup value.
   * @returns {*|boolean}
   */
  getSheetData(key) {
    const sheet = this.lookupSheet(key)

    return sheet ? sheet.getData() : false
  }

  /**
   * Clear a target sheet.
   * @param {*} key Sheet lookup value.
   * @returns {Promise<void>|void|boolean}
   */
  clearSheet(key) {
    const sheet = this.lookupSheet(key)

    return sheet ? sheet.clear() : false
  }

  /**
   * Remove a target sheet.
   * @param {*} key Sheet lookup value.
   * @returns {void}
   */
  removeSheetFunc(key) {
    const sheet = this.lookupSheet(key)

    if (sheet) {
      this.removeSheet(sheet)
    }
  }

  /**
   * Activate a target sheet.
   * @param {*} key Sheet lookup value.
   * @returns {void|boolean}
   */
  activeSheetFunc(key) {
    const sheet = this.lookupSheet(key)

    return sheet ? this.loadSheet(sheet) : false
  }
}
