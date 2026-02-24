'use strict'

import defaultOptions from './defaults/options.js'

import ColumnManager from './ColumnManager.js'
import RowManager from './RowManager.js'
import FooterManager from './FooterManager.js'

import InteractionMonitor from './tools/InteractionMonitor.js'
import ComponentFunctionBinder from './tools/ComponentFunctionBinder.js'
import DataLoader from './tools/DataLoader.js'

import ExternalEventBus from './tools/ExternalEventBus.js'
import InternalEventBus from './tools/InternalEventBus.js'

import DeprecationAdvisor from './tools/DeprecationAdvisor.js'
import DependencyRegistry from './tools/DependencyRegistry.js'

import ModuleBinder from './tools/ModuleBinder.js'

import OptionsList from './tools/OptionsList.js'

import Alert from './tools/Alert.js'

class Tabulator extends ModuleBinder {
  // default setup options
  static defaultOptions = defaultOptions

  /**
   * Extend an existing module namespace.
   * @param {...*} args Extension arguments.
   * @returns {void}
   */
  static extendModule(...args) {
    Tabulator.initializeModuleBinder()
    Tabulator._extendModule(...args)
  }

  /**
   * Register a module with Tabulator.
   * @param {...*} args Module registration arguments.
   * @returns {void}
   */
  static registerModule(...args) {
    Tabulator.initializeModuleBinder()
    Tabulator._registerModule(...args)
  }

  /**
   * @param {HTMLElement|string} element Target element or selector.
   * @param {object} options Table options.
   * @param {Array<Function>} [modules] Module overrides.
   */
  constructor(element, options, modules) {
    super()

    Tabulator.initializeModuleBinder(modules)

    this.options = {}

    this.columnManager = null // hold Column Manager
    this.rowManager = null // hold Row Manager
    this.footerManager = null // holder Footer Manager
    this.alertManager = null // hold Alert Manager
    this.vdomHoz = null // holder horizontal virtual dom
    this.externalEvents = null // handle external event messaging
    this.eventBus = null // handle internal event messaging
    this.interactionMonitor = false // track user interaction
    this.browser = '' // hold current browser type
    this.browserSlow = false // handle reduced functionality for slower browsers
    this.browserMobile = false // check if running on mobile, prevent resize cancelling edit on keyboard appearance
    this.rtl = false // check if the table is in RTL mode
    this.originalElement = null // hold original table element if it has been replaced

    this.componentFunctionBinder = new ComponentFunctionBinder(this) // bind component functions
    this.dataLoader = false // bind component functions

    this.modules = {} // hold all modules bound to this table
    this.modulesCore = [] // hold core modules bound to this table (for initialization purposes)
    this.modulesRegular = [] // hold regular modules bound to this table (for initialization purposes)

    this.deprecationAdvisor = new DeprecationAdvisor(this)
    this.optionsList = new OptionsList(this, 'table constructor')

    this.dependencyRegistry = new DependencyRegistry(this)

    this.initialized = false
    this.destroyed = false

    if (this.initializeElement(element)) {
      this.initializeCoreSystems(options)

      // delay table creation to allow event bindings immediately after the constructor
      setTimeout(() => this._create())
    }

    this.constructor.registry.register(this) // register table for inter-device communication
  }

  /**
   * Resolve and validate table target element.
   * @param {HTMLElement|string} element Target element or selector.
   * @returns {boolean}
   */
  initializeElement(element) {
    if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) {
      this.element = element
      return true
    }

    if (typeof element === 'string') {
      if (typeof document === 'undefined') {
        console.error('Tabulator Creation Error - Selector lookup requires a browser document context')
        return false
      }

      this.element = document.querySelector(element)

      if (this.element) {
        return true
      }

      console.error('Tabulator Creation Error - no element found matching selector: ', element)
      return false
    } else {
      console.error('Tabulator Creation Error - Invalid element provided:', element)
      return false
    }
  }

  /**
   * Initialize core managers, options, buses, and dependencies.
   * @param {object} options Table options.
   * @returns {void}
   */
  initializeCoreSystems(options) {
    this.columnManager = new ColumnManager(this)
    this.rowManager = new RowManager(this)
    this.footerManager = new FooterManager(this)
    this.dataLoader = new DataLoader(this)
    this.alertManager = new Alert(this)

    this._bindModules()

    this.options = this.optionsList.generate(Tabulator.defaultOptions, options)

    this._clearObjectPointers()

    this._mapDeprecatedFunctionality()

    this.externalEvents = new ExternalEventBus(this, this.options, this.options.debugEventsExternal)
    this.eventBus = new InternalEventBus(this.options.debugEventsInternal)

    this.interactionMonitor = new InteractionMonitor(this)

    this.dataLoader.initialize()
    this.footerManager.initialize()

    this.dependencyRegistry.initialize()
  }

  // convert deprecated functionality to new functions
  /**
   * Map deprecated functionality to modern APIs.
   * @returns {void}
   */
  _mapDeprecatedFunctionality() {
    // all previously deprecated functionality removed in the 6.0 release
  }

  /**
   * Clear current browser text selection within the table.
   * @returns {void}
   */
  _clearSelection() {
    this.element.classList.add('tabulator-block-select')

    const selection = window.getSelection ? window.getSelection() : null

    if (selection) {
      if (selection.empty) {
        // Chrome
        selection.empty()
      } else if (selection.removeAllRanges) {
        // Firefox
        selection.removeAllRanges()
      }
    }

    this.element.classList.remove('tabulator-block-select')
  }

  // create table
  /**
   * Build and initialize table internals.
   * @returns {void}
   */
  _create() {
    this.externalEvents.dispatch('tableBuilding')
    this.eventBus.dispatch('table-building')

    this._compatibilityCheck()

    this._rtlCheck()

    this._buildElement()

    this._initializeTable()

    this.initialized = true

    this._loadInitialData().finally(() => {
      this.eventBus.dispatch('table-initialized')
      this.externalEvents.dispatch('tableBuilt')
    })
  }

  /**
   * Warn when the page is running in Quirks Mode.
   * @returns {void}
   */
  _compatibilityCheck() {
    if (typeof document !== 'undefined' && document.compatMode !== 'CSS1Compat') {
      console.warn(
        'Tabulator Warning - Page is running in Quirks Mode (missing or invalid <!DOCTYPE html>). This can cause inconsistent table layout/rendering, including formatter height issues.'
      )
    }
  }

  /**
   * Apply RTL/LTR mode classes based on options and computed style.
   * @returns {void}
   */
  _rtlCheck() {
    const style = window.getComputedStyle(this.element)

    switch (this.options.textDirection) {
      case 'auto':
        if (style.direction !== 'rtl') {
          break
        }

      // falls through

      case 'rtl':
        this.element.classList.add('tabulator-rtl')
        this.rtl = true
        break

      case 'ltr':
        this.element.classList.add('tabulator-ltr')

      // falls through

      default:
        this.rtl = false
    }
  }

  // clear pointers to objects in default config object
  /**
   * Clone pointer-based option values to prevent shared references.
   * @returns {void}
   */
  _clearObjectPointers() {
    this.options.columns = [...this.options.columns]

    if (Array.isArray(this.options.data) && !this.options.reactiveData) {
      this.options.data = [...this.options.data]
    }
  }

  // build tabulator element
  /**
   * Build root table element and apply size constraints.
   * @returns {void}
   */
  _buildElement() {
    let element = this.element
    const options = this.options
    let newElement

    if (element.tagName === 'TABLE') {
      this.originalElement = this.element
      newElement = document.createElement('div')

      // transfer attributes to new element
      const attributes = element.attributes

      // loop through attributes and apply them on div
      Array.from(attributes).forEach((attribute) => {
        newElement.setAttribute(attribute.name, attribute.value)
      })

      // replace table with div element
      element.parentNode.replaceChild(newElement, element)

      this.element = element = newElement
    }

    element.classList.add('tabulator')
    element.setAttribute('role', 'grid')

    // empty element
    element.replaceChildren()

    // set table height
    if (options.height) {
      options.height = Number.isNaN(Number(options.height)) ? options.height : `${options.height}px`
      element.style.height = options.height
    }

    // set table min height
    if (options.minHeight !== false) {
      options.minHeight = Number.isNaN(Number(options.minHeight)) ? options.minHeight : `${options.minHeight}px`
      element.style.minHeight = options.minHeight
    }

    // set table maxHeight
    if (options.maxHeight !== false) {
      options.maxHeight = Number.isNaN(Number(options.maxHeight)) ? options.maxHeight : `${options.maxHeight}px`
      element.style.maxHeight = options.maxHeight
    }
  }

  // initialize core systems and modules
  /**
   * Initialize managers/modules and append core DOM structure.
   * @returns {void}
   */
  _initializeTable() {
    const element = this.element
    const options = this.options

    this.interactionMonitor.initialize()

    this.columnManager.initialize()
    this.rowManager.initialize()

    this._detectBrowser()

    // initialize core modules
    this.modulesCore.forEach((mod) => {
      mod.initialize()
    })

    // build table elements
    element.appendChild(this.columnManager.getElement())
    element.appendChild(this.rowManager.getElement())

    if (options.footerElement) {
      this.footerManager.activate()
    }

    if (options.autoColumns && options.data) {
      this.columnManager.generateColumnsFromRowData(this.options.data)
    }

    // initialize regular modules
    this.modulesRegular.forEach((mod) => {
      mod.initialize()
    })

    this.columnManager.setColumns(options.columns)

    this.eventBus.dispatch('table-built')
  }

  /**
   * Load initial data and align headers.
   * @returns {Promise<*>}
   */
  _loadInitialData() {
    return this.dataLoader.load(this.options.data).finally(() => {
      this.columnManager.verticalAlignHeaders()
    })
  }

  // deconstructor
  /**
   * Destroy table instance and clean DOM/events.
   * @returns {void}
   */
  destroy() {
    const element = this.element

    this.destroyed = true

    this.constructor.registry.deregister(this) // deregister table from inter-device communication

    this.eventBus.dispatch('table-destroy')

    // clear row data
    this.rowManager.destroy()

    // clear DOM
    element.replaceChildren()
    element.classList.remove('tabulator')
    element.removeAttribute('tabulator-layout')

    this.externalEvents.dispatch('tableDestroyed')
  }

  /**
   * Detect browser and mobile environment flags.
   * @returns {void}
   */
  _detectBrowser() {
    const ua = navigator.userAgent || navigator.vendor || window.opera

    if (ua.includes('Trident')) {
      this.browser = 'ie'
      this.browserSlow = true
    } else if (ua.includes('Edge')) {
      this.browser = 'edge'
      this.browserSlow = true
    } else if (ua.includes('Firefox')) {
      this.browser = 'firefox'
      this.browserSlow = false
    } else if (ua.includes('Mac OS')) {
      this.browser = 'safari'
      this.browserSlow = false
    } else {
      this.browser = 'other'
      this.browserSlow = false
    }

    this.browserMobile =
      /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
        ua
      ) ||
      /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
        ua.slice(0, 4)
      )
  }

  /**
   * Warn when APIs are called before initialization.
   * @param {string|boolean} [func] Function name.
   * @param {string} [msg] Additional warning text.
   * @returns {boolean}
   */
  initGuard(func, msg) {
    let stack, line

    if (this.options.debugInitialization && !this.initialized) {
      if (!func) {
        stack = new Error().stack.split('\n')

        line = stack[0] === 'Error' ? stack[2] : stack[1]

        if (line[0] === ' ') {
          func = line.trim().split(' ')[1].split('.')[1]
        } else {
          func = line.trim().split('@')[0]
        }
      }

      console.warn(
        'Table Not Initialized - Calling the ' +
          func +
          ' function before the table is initialized may result in inconsistent behavior, Please wait for the `tableBuilt` event before calling this function.' +
          (msg ? ' ' + msg : '')
      )
    }

    return this.initialized
  }

  /// /////////////// Data Handling //////////////////
  // block table redrawing
  /**
   * Block redraw operations.
   * @returns {void}
   */
  blockRedraw() {
    this.initGuard()

    this.eventBus.dispatch('redraw-blocking')

    this.rowManager.blockRedraw()
    this.columnManager.blockRedraw()

    this.eventBus.dispatch('redraw-blocked')
  }

  // restore table redrawing
  /**
   * Restore redraw operations.
   * @returns {void}
   */
  restoreRedraw() {
    this.initGuard()

    this.eventBus.dispatch('redraw-restoring')

    this.rowManager.restoreRedraw()
    this.columnManager.restoreRedraw()

    this.eventBus.dispatch('redraw-restored')
  }

  // load data
  /**
   * Load data into the table.
   * @param {Array<object>|string} data Data array or JSON string.
   * @param {object} [params] Load params.
   * @param {object} [config] Load config.
   * @returns {Promise<*>}
   */
  setData(data, params, config) {
    this.initGuard(false, "To set initial data please use the 'data' property in the table constructor.")

    return this.dataLoader.load(data, params, config, false)
  }

  // clear data
  /**
   * Clear all table data.
   * @returns {void}
   */
  clearData() {
    this.initGuard()

    this.dataLoader.blockActiveLoad()
    this.rowManager.clearData()
  }

  // get table data array
  /**
   * Get table row data.
   * @param {string|boolean} [active] Data scope.
   * @returns {Array<object>}
   */
  getData(active) {
    return this.rowManager.getData(active)
  }

  // get table data array count
  /**
   * Get row count for data scope.
   * @param {string|boolean} [active] Data scope.
   * @returns {number}
   */
  getDataCount(active) {
    return this.rowManager.getDataCount(active)
  }

  // replace data, keeping table in position with same sort
  /**
   * Replace table data while preserving state.
   * @param {Array<object>|string} data Data array or JSON string.
   * @param {object} [params] Load params.
   * @param {object} [config] Load config.
   * @returns {Promise<*>}
   */
  replaceData(data, params, config) {
    this.initGuard()

    return this.dataLoader.load(data, params, config, true, true)
  }

  // update table data
  /**
   * Update multiple existing rows.
   * @param {Array<object>|string} data Row updates.
   * @returns {Promise<void>}
   */
  updateData(data) {
    let responses = 0

    this.initGuard()

    return new Promise((resolve, reject) => {
      this.dataLoader.blockActiveLoad()

      if (typeof data === 'string') {
        data = JSON.parse(data)
      }

      if (data && data.length > 0) {
        data.forEach((item) => {
          const row = this.rowManager.findRow(item[this.options.index])

          if (row) {
            responses++

            row
              .updateData(item)
              .then(() => {
                responses--

                if (!responses) {
                  resolve()
                }
              })
              .catch((e) => {
                reject('Update Error - Unable to update row', item, e)
              })
          } else {
            reject('Update Error - Unable to find row', item)
          }
        })
      } else {
        console.warn('Update Error - No data provided')
        reject('Update Error - No data provided')
      }
    })
  }

  /**
   * Add multiple rows.
   * @param {Array<object>|string} data Rows to add.
   * @param {boolean} [pos] Insert position.
   * @param {*} [index] Index reference.
   * @returns {Promise<Array<object>>}
   */
  addData(data, pos, index) {
    this.initGuard()

    return new Promise((resolve, reject) => {
      this.dataLoader.blockActiveLoad()

      if (typeof data === 'string') {
        data = JSON.parse(data)
      }

      if (data) {
        this.rowManager.addRows(data, pos, index).then((rows) => {
          const output = rows.map((row) => row.getComponent())

          resolve(output)
        })
      } else {
        console.warn('Update Error - No data provided')
        reject('Update Error - No data provided')
      }
    })
  }

  // update table data
  /**
   * Update existing rows or add missing rows.
   * @param {Array<object>|string} data Row data.
   * @returns {Promise<Array<object>>}
   */
  updateOrAddData(data) {
    const rows = []
    let responses = 0

    this.initGuard()

    return new Promise((resolve, reject) => {
      this.dataLoader.blockActiveLoad()

      if (typeof data === 'string') {
        data = JSON.parse(data)
      }

      if (data && data.length > 0) {
        data.forEach((item) => {
          const row = this.rowManager.findRow(item[this.options.index])

          responses++

          if (row) {
            row.updateData(item).then(() => {
              responses--
              rows.push(row.getComponent())

              if (!responses) {
                resolve(rows)
              }
            })
          } else {
            this.rowManager.addRows(item).then((newRows) => {
              responses--
              rows.push(newRows[0].getComponent())

              if (!responses) {
                resolve(rows)
              }
            })
          }
        })
      } else {
        console.warn('Update Error - No data provided')
        reject('Update Error - No data provided')
      }
    })
  }

  // get row object
  /**
   * Get row component by index/key.
   * @param {*} index Row identifier.
   * @returns {object|boolean}
   */
  getRow(index) {
    const row = this.rowManager.findRow(index)

    if (row) {
      return row.getComponent()
    } else {
      console.warn('Find Error - No matching row found:', index)
      return false
    }
  }

  // get row object
  /**
   * Get row component by display position.
   * @param {number} position Row position.
   * @returns {object|boolean}
   */
  getRowFromPosition(position) {
    const row = this.rowManager.getRowFromPosition(position)

    if (row) {
      return row.getComponent()
    } else {
      console.warn('Find Error - No matching row found:', position)
      return false
    }
  }

  // delete row from table
  /**
   * Delete one or more rows.
   * @param {*|Array<*>} index Row id(s).
   * @returns {Promise<void>}
   */
  deleteRow(index) {
    const foundRows = []

    this.initGuard()

    if (!Array.isArray(index)) {
      index = [index]
    }

    // find matching rows
    for (const item of index) {
      const row = this.rowManager.findRow(item, true)

      if (row) {
        foundRows.push(row)
      } else {
        console.error('Delete Error - No matching row found:', item)
        return Promise.reject('Delete Error - No matching row found')
      }
    }

    // sort rows into correct order to ensure smooth delete from table
    foundRows.sort((a, b) => {
      return this.rowManager.rows.indexOf(a) > this.rowManager.rows.indexOf(b) ? 1 : -1
    })

    // delete rows
    foundRows.forEach((row) => {
      row.delete()
    })

    this.rowManager.reRenderInPosition()

    return Promise.resolve()
  }

  // add row to table
  /**
   * Add a single row.
   * @param {object|string} data Row data.
   * @param {boolean} [pos] Insert position.
   * @param {*} [index] Index reference.
   * @returns {Promise<object>}
   */
  async addRow(data, pos, index) {
    this.initGuard()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    const rows = await this.rowManager.addRows(data, pos, index, true)
    return rows[0].getComponent()
  }

  // update a row if it exists otherwise create it
  /**
   * Update a row or add when missing.
   * @param {*} index Row identifier.
   * @param {object|string} data Row data.
   * @returns {Promise<object>}
   */
  async updateOrAddRow(index, data) {
    const row = this.rowManager.findRow(index)

    this.initGuard()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (row) {
      return row.updateData(data).then(() => {
        return row.getComponent()
      })
    } else {
      return this.rowManager.addRows(data).then((rows) => {
        return rows[0].getComponent()
      })
    }
  }

  // update row data
  /**
   * Update a single row.
   * @param {*} index Row identifier.
   * @param {object|string} data Row data.
   * @returns {Promise<object>}
   */
  async updateRow(index, data) {
    const row = this.rowManager.findRow(index)

    this.initGuard()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (row) {
      return row.updateData(data).then(() => {
        return Promise.resolve(row.getComponent())
      })
    } else {
      console.warn('Update Error - No matching row found:', index)
      return Promise.reject('Update Error - No matching row found')
    }
  }

  // scroll to row in DOM
  /**
   * Scroll to a row.
   * @param {*} index Row identifier.
   * @param {string} [position] Scroll position.
   * @param {boolean} [ifVisible] Skip if visible.
   * @returns {Promise<void>}
   */
  scrollToRow(index, position, ifVisible) {
    const row = this.rowManager.findRow(index)

    if (row) {
      return this.rowManager.scrollToRow(row, position, ifVisible)
    } else {
      console.warn('Scroll Error - No matching row found:', index)
      return Promise.reject('Scroll Error - No matching row found')
    }
  }

  /**
   * Move a row relative to another row.
   * @param {*} from Source row identifier.
   * @param {*} to Target row identifier.
   * @param {boolean} [after] Insert after target.
   * @returns {void}
   */
  moveRow(from, to, after) {
    const fromRow = this.rowManager.findRow(from)

    this.initGuard()

    if (fromRow) {
      fromRow.moveToRow(to, after)
    } else {
      console.warn('Move Error - No matching row found:', from)
    }
  }

  /**
   * Get row components.
   * @param {string|boolean} [active] Row scope.
   * @returns {Array<object>}
   */
  getRows(active) {
    return this.rowManager.getComponents(active)
  }

  // get position of row in table
  /**
   * Get display position of a row.
   * @param {*} index Row identifier.
   * @returns {number|boolean}
   */
  getRowPosition(index) {
    const row = this.rowManager.findRow(index)

    if (row) {
      return row.getPosition()
    } else {
      console.warn('Position Error - No matching row found:', index)
      return false
    }
  }

  /// //////////// Column Functions  ///////////////
  /**
   * Set full column definitions.
   * @param {Array<object>} definition Column definitions.
   * @returns {void}
   */
  setColumns(definition) {
    this.initGuard(false, "To set initial columns please use the 'columns' property in the table constructor")

    this.columnManager.setColumns(definition)
  }

  /**
   * Get column components.
   * @param {boolean} [structured] Return tree structure.
   * @returns {Array<object>}
   */
  getColumns(structured) {
    return this.columnManager.getComponents(structured)
  }

  /**
   * Get column component by field.
   * @param {string} field Column field.
   * @returns {object|boolean}
   */
  getColumn(field) {
    const column = this.columnManager.findColumn(field)

    if (column) {
      return column.getComponent()
    } else {
      console.warn('Find Error - No matching column found:', field)
      return false
    }
  }

  /**
   * Get column definition tree.
   * @returns {Array<object>}
   */
  getColumnDefinitions() {
    return this.columnManager.getDefinitionTree()
  }

  /**
   * Show a column.
   * @param {string} field Column field.
   * @returns {boolean|void}
   */
  showColumn(field) {
    const column = this.columnManager.findColumn(field)

    this.initGuard()

    if (column) {
      column.show()
    } else {
      console.warn('Column Show Error - No matching column found:', field)
      return false
    }
  }

  /**
   * Hide a column.
   * @param {string} field Column field.
   * @returns {boolean|void}
   */
  hideColumn(field) {
    const column = this.columnManager.findColumn(field)

    this.initGuard()

    if (column) {
      column.hide()
    } else {
      console.warn('Column Hide Error - No matching column found:', field)
      return false
    }
  }

  /**
   * Toggle a column's visibility.
   * @param {string} field Column field.
   * @returns {boolean|void}
   */
  toggleColumn(field) {
    const column = this.columnManager.findColumn(field)

    this.initGuard()

    if (column) {
      column.visible ? column.hide() : column.show()
    } else {
      console.warn('Column Visibility Toggle Error - No matching column found:', field)
      return false
    }
  }

  /**
   * Add a column definition.
   * @param {object} definition Column definition.
   * @param {boolean} [before] Insert before reference.
   * @param {string} [field] Reference field.
   * @returns {Promise<object>}
   */
  async addColumn(definition, before, field) {
    const column = this.columnManager.findColumn(field)

    this.initGuard()

    const column_1 = await this.columnManager.addColumn(definition, before, column)
    return column_1.getComponent()
  }

  /**
   * Delete a column.
   * @param {string} field Column field.
   * @returns {Promise<void>}
   */
  deleteColumn(field) {
    const column = this.columnManager.findColumn(field)

    this.initGuard()

    if (column) {
      return column.delete()
    } else {
      console.warn('Column Delete Error - No matching column found:', field)
      return Promise.reject()
    }
  }

  /**
   * Update a column definition.
   * @param {string} field Column field.
   * @param {object} definition New definition.
   * @returns {Promise<object>}
   */
  updateColumnDefinition(field, definition) {
    const column = this.columnManager.findColumn(field)

    this.initGuard()

    if (column) {
      return column.updateDefinition(definition)
    } else {
      console.warn('Column Update Error - No matching column found:', field)
      return Promise.reject()
    }
  }

  /**
   * Move a column.
   * @param {string} from Source field.
   * @param {string} to Target field.
   * @param {boolean} [after] Insert after target.
   * @returns {void}
   */
  moveColumn(from, to, after) {
    const fromColumn = this.columnManager.findColumn(from)
    const toColumn = this.columnManager.findColumn(to)

    this.initGuard()

    if (fromColumn) {
      if (toColumn) {
        this.columnManager.moveColumn(fromColumn, toColumn, after)
      } else {
        console.warn('Move Error - No matching column found:', toColumn)
      }
    } else {
      console.warn('Move Error - No matching column found:', from)
    }
  }

  // scroll to column in DOM
  /**
   * Scroll to a column.
   * @param {string} field Column field.
   * @param {string} [position] Scroll position.
   * @param {boolean} [ifVisible] Skip if visible.
   * @returns {Promise<void>}
   */
  scrollToColumn(field, position, ifVisible) {
    const column = this.columnManager.findColumn(field)

    if (column) {
      return this.columnManager.scrollToColumn(column, position, ifVisible)
    }

    console.warn('Scroll Error - No matching column found:', field)
    return Promise.reject('Scroll Error - No matching column found')
  }

  /// ///////// General Public Functions ////////////
  // redraw list without updating data
  /**
   * Redraw table without data refresh.
   * @param {boolean} [force] Force redraw.
   * @returns {void}
   */
  redraw(force) {
    this.initGuard()

    this.columnManager.redraw(force)
    this.rowManager.redraw(force)
  }

  /**
   * Set table height and re-render vertical renderer.
   * @param {string|number} height Height value.
   * @returns {void}
   */
  setHeight(height) {
    this.options.height = Number.isNaN(Number(height)) ? height : `${height}px`
    this.element.style.height = this.options.height
    this.rowManager.initializeRenderer()
    this.rowManager.redraw(true)
  }

  /// ///////////////// Event Bus ///////////////////

  /**
   * Subscribe to external event.
   * @param {string} key Event key.
   * @param {Function} callback Event callback.
   * @returns {void}
   */
  on(key, callback) {
    this.externalEvents.subscribe(key, callback)
  }

  /**
   * Unsubscribe from external event.
   * @param {string} key Event key.
   * @param {Function} callback Event callback.
   * @returns {void}
   */
  off(key, callback) {
    this.externalEvents.unsubscribe(key, callback)
  }

  /**
   * Dispatch external event.
   * @param {...*} args Event args.
   * @returns {void}
   */
  dispatchEvent(...args) {
    this.externalEvents.dispatch(...args)
  }

  /// ///////////////// Alerts ///////////////////

  /**
   * Show an alert.
   * @param {*} contents Alert contents.
   * @param {string} [type] Alert type.
   * @returns {void}
   */
  alert(contents, type) {
    this.initGuard()

    this.alertManager.alert(contents, type)
  }

  /**
   * Clear active alert.
   * @returns {void}
   */
  clearAlert() {
    this.initGuard()

    this.alertManager.clear()
  }

  /// /////////// Extension Management //////////////
  /**
   * Check if a module is installed.
   * @param {string} plugin Module key.
   * @param {boolean} [required] Log when missing.
   * @returns {boolean}
   */
  modExists(plugin, required) {
    if (this.modules[plugin]) {
      return true
    }

    if (required) {
      console.error('Tabulator Module Not Installed: ' + plugin)
    }

    return false
  }

  /**
   * Get installed module by key.
   * @param {string} key Module key.
   * @returns {*}
   */
  module(key) {
    const mod = this.modules[key]

    if (!mod) {
      console.error('Tabulator module not installed: ' + key)
    }

    return mod
  }
}

export default Tabulator
