import CoreFeature from './CoreFeature.js'
import Popup from './tools/Popup.js'

export default class Module extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this._handler = null
  }

  /**
   * Initialize module lifecycle hook.
   */
  initialize() {
    // setup module when table is initialized, to be overridden in module
  }

  /// ////////////////////////////////
  /// /// Options Registration ///////
  /// ////////////////////////////////

  /**
   * Register a table option default.
   * @param {string} key Option key.
   * @param {*} value Default value.
   */
  registerTableOption(key, value) {
    this.table.optionsList.register(key, value)
  }

  /**
   * Register a column option default.
   * @param {string} key Option key.
   * @param {*} value Default value.
   */
  registerColumnOption(key, value) {
    this.table.columnManager.optionsList.register(key, value)
  }

  /// ////////////////////////////////
  /// Public Function Registration ///
  /// ////////////////////////////////

  /**
   * Register a public table function.
   * @param {string} name Function name.
   * @param {Function} func Function handler.
   */
  registerTableFunction(name, func) {
    if (this.table[name] === undefined) {
      this.table[name] = (...args) => {
        this.table.initGuard(name)

        return func(...args)
      }
    } else {
      console.warn('Unable to bind table function, name already in use', name)
    }
  }

  /**
   * Register a component function binding.
   * @param {string} component Component type.
   * @param {string} func Function name.
   * @param {Function} handler Function handler.
   * @returns {*}
   */
  registerComponentFunction(component, func, handler) {
    return this.table.componentFunctionBinder.bind(component, func, handler)
  }

  /// ////////////////////////////////
  /// /////// Data Pipeline //////////
  /// ////////////////////////////////

  /**
   * Register data pipeline handler.
   * @param {Function} handler Pipeline handler.
   * @param {number} priority Handler priority.
   */
  registerDataHandler(handler, priority) {
    this.table.rowManager.registerDataPipelineHandler(handler, priority)
    this._handler = handler
  }

  /**
   * Register display pipeline handler.
   * @param {Function} handler Pipeline handler.
   * @param {number} priority Handler priority.
   */
  registerDisplayHandler(handler, priority) {
    this.table.rowManager.registerDisplayPipelineHandler(handler, priority)
    this._handler = handler
  }

  /**
   * Get display rows at handler stage.
   * @param {number} [adjust] Stage offset.
   * @returns {Array<object>}
   */
  displayRows(adjust) {
    let index = this.table.rowManager.displayRows.length - 1

    if (this._handler) {
      const lookupIndex = this.table.rowManager.displayPipeline.findIndex((item) => item.handler === this._handler)

      if (lookupIndex > -1) {
        index = lookupIndex
      }
    }

    if (adjust) {
      index += adjust
    }

    if (this._handler) {
      return index > -1 ? this.table.rowManager.getDisplayRows(index) : this.activeRows()
    }

    return this.activeRows()
  }

  /**
   * Get active rows.
   * @returns {Array<object>}
   */
  activeRows() {
    return this.table.rowManager.activeRows
  }

  /**
   * Refresh active data pipeline.
   * @param {boolean} renderInPosition Render-in-position flag.
   * @param {Function} [handler] Pipeline handler.
   */
  refreshData(renderInPosition, handler) {
    handler ??= this._handler

    if (handler) {
      this.table.rowManager.refreshActiveData(handler, false, renderInPosition)
    }
  }

  /// ////////////////////////////////
  /// ///// Footer Management ////////
  /// ////////////////////////////////

  /**
   * Append element to footer.
   * @param {HTMLElement} element Element to append.
   * @returns {*}
   */
  footerAppend(element) {
    return this.table.footerManager.append(element)
  }

  /**
   * Prepend element to footer.
   * @param {HTMLElement} element Element to prepend.
   * @returns {*}
   */
  footerPrepend(element) {
    return this.table.footerManager.prepend(element)
  }

  /**
   * Remove element from footer.
   * @param {HTMLElement} element Element to remove.
   * @returns {*}
   */
  footerRemove(element) {
    return this.table.footerManager.remove(element)
  }

  /// ////////////////////////////////
  /// ///// Popups Management ////////
  /// ////////////////////////////////

  /**
   * Create popup helper.
   * @param {HTMLElement} menuEl Popup content element.
   * @param {HTMLElement} [menuContainer] Popup container.
   * @returns {Popup}
   */
  popup(menuEl, menuContainer) {
    return new Popup(this.table, menuEl, menuContainer)
  }

  /// ////////////////////////////////
  /// ///// Alert Management ////////
  /// ////////////////////////////////

  /**
   * Show alert content.
   * @param {*} content Alert content.
   * @param {string} type Alert type.
   * @returns {*}
   */
  alert(content, type) {
    return this.table.alertManager.alert(content, type)
  }

  /**
   * Clear active alert.
   * @returns {*}
   */
  clearAlert() {
    return this.table.alertManager.clear()
  }
}
