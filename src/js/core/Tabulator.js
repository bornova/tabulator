import defaultOptions from './defaults/options'

import ColumnManager from './column/ColumnManager'
import RowManager from './row/RowManager'
import FooterManager from './footer/FooterManager'

import InteractionMonitor from './tools/InteractionMonitor'
import ComponentFunctionBinder from './tools/ComponentFunctionBinder'
import DataLoader from './tools/DataLoader'

import ExternalEventBus from './tools/ExternalEventBus'
import InternalEventBus from './tools/InternalEventBus'

import DependencyRegistry from './tools/DependencyRegistry'

import ModuleBinder from './tools/ModuleBinder'

import OptionsList from './tools/OptionsList'

import Alert from './tools/Alert'
import Logger from './tools/Logger'
import AutoScroller from './tools/AutoScroller'

/** @typedef {import('./row/RowComponent').default} RowComponent */
/** @typedef {import('./column/ColumnComponent').default} ColumnComponent */
/** @typedef {import('./column/ColumnComponent').ColumnDefinition} ColumnDefinition */

/**
 * Controls which parts of the table are included in export/output operations
 * (used by downloadConfig, htmlOutputConfig, clipboardCopyConfig, and printConfig).
 * @typedef {object} ExportConfig
 * @property {boolean} [columnHeaders] Include column headers (default true).
 * @property {boolean} [columnGroups] Include column group headers (default true).
 * @property {boolean} [rowHeaders] Include row header columns (default true).
 * @property {boolean} [rowGroups] Include row group header rows (default true).
 * @property {boolean} [columnCalcs] Include column calculation rows (default true).
 * @property {boolean} [dataTree] Include child rows from data tree (default true).
 * @property {boolean} [formatCells] Apply cell formatters in the output (default true).
 */

/**
 * Selectively enable persistence for specific table state.
 * @typedef {object} PersistenceConfig
 * @property {boolean} [sort] Persist column sort state.
 * @property {boolean} [filter] Persist active data filters.
 * @property {boolean} [headerFilter] Persist header filter input values.
 * @property {boolean} [group] Persist row grouping state.
 * @property {boolean} [page] Persist the current page and page size.
 * @property {boolean|string[]} [columns] Persist column layout; pass an array of property names to limit which column properties are saved.
 */

/**
 * Ajax request configuration object (passed to the underlying fetch call).
 * @typedef {object} AjaxConfig
 * @property {string} [method] HTTP method (default 'GET').
 * @property {object} [headers] Request headers object.
 * @property {string} [credentials] Credentials mode ('omit', 'same-origin', 'include').
 * @property {string} [mode] Request mode ('cors', 'no-cors', 'same-origin').
 * @property {string} [cache] Cache mode ('default', 'no-cache', 'reload', 'force-cache', 'only-if-cached').
 * @property {string} [redirect] Redirect mode ('follow', 'error', 'manual').
 */

/**
 * @typedef {object} Options
 *
 * --- General Table Configuration ---
 * @property {string|number} [height] Sets the height of the containing element; any valid CSS height value. Defaults to false (auto-size).
 * @property {string|number} [minHeight] Sets the minimum height for the table; any valid CSS height value.
 * @property {string|number} [maxHeight] Sets the maximum height for the table; any valid CSS height value.
 * @property {object} [dependencies] Register external library dependencies (e.g. jsPDF, XLSX) for use by modules.
 * @property {"virtual"|"basic"} [renderVertical] Set the vertical renderer. "virtual" (default) uses a virtual DOM for performance.
 * @property {number} [renderVerticalBuffer] Manually set the size of the virtual vertical renderer buffer in pixels.
 * @property {"basic"|"virtual"} [renderHorizontal] Set the horizontal renderer. "virtual" enables horizontal virtual DOM.
 * @property {string|HTMLElement} [placeholder] Placeholder element or text to display on an empty table.
 * @property {string|HTMLElement|boolean} [footerElement] Footer element or HTML string to append to the table footer.
 * @property {boolean|Function} [history] Enable user interaction history so changes can be undone/redone.
 * @property {boolean|object} [keybindings] Keybinding configuration object or false to disable.
 * @property {string|boolean} [locale] Set the current localisation language; false uses the default.
 * @property {object} [langs] Localisation templates keyed by locale string.
 * @property {ExportConfig} [downloadConfig] Choose which parts of the table are included in downloaded files.
 * @property {string} [downloadRowRange] Set the range of rows included in downloads ("active", "visible", "selected", or "all").
 * @property {Function} [downloadEncoder] Override the default file encoder for downloads.
 * @property {ExportConfig} [htmlOutputConfig] Choose which parts of the table are included in getHtml output.
 * @property {boolean} [reactiveData] Enable reactive data so the table automatically updates when the data array is mutated.
 * @property {boolean|object|Function} [tabEndNewRow] Add a new row when the user tabs off the end of the table.
 * @property {"blocking"|"highlight"} [validationMode] Set the validation mode; "blocking" (default) prevents invalid input, "highlight" marks it.
 * @property {"auto"|"ltr"|"rtl"} [textDirection] Set text direction for the table.
 * @property {boolean} [debugInvalidOptions] Show console warnings for invalid table options. Defaults to true.
 * @property {boolean} [debugEventsExternal] Log all external events to the console.
 * @property {boolean} [debugEventsInternal] Log all internal events to the console.
 * @property {boolean} [debugInitialization] Warn when functions are called before the table is initialised.
 * @property {boolean} [debugInvalidComponentFuncs] Warn when invalid component functions are called.
 * @property {boolean} [debugLogging] Enable diagnostic logging output.
 * @property {boolean} [debugDeprecation] Warn when deprecated options or functions are used.
 * @property {boolean|string|HTMLElement} [popupContainer] Containing element for popups; false appends to document body.
 * @property {boolean} [autoResize] Automatically resize the table when its containing element changes size. Defaults to true.
 * @property {number} [tooltipDelay] Delay in milliseconds before a tooltip is displayed.
 *
 * --- Columns ---
 * @property {ColumnDefinition[]} [columns] Column definition array.
 * @property {object} [columnDefaults] Default properties to apply to every column definition.
 * @property {boolean} [autoColumns] Automatically generate column definitions from the structure of the first data row.
 * @property {Function|any[]|object} [autoColumnsDefinitions] Manipulate auto-generated column definitions.
 * @property {"fitData"|"fitColumns"|"fitDataFill"|"fitDataStretch"|"fitDataTable"} [layout] Layout mode for table columns. Defaults to "fitData".
 * @property {boolean} [layoutColumnsOnNewData] Recalculate column widths when new data is loaded.
 * @property {"hide"|"collapse"|boolean} [responsiveLayout] Automatically hide/show columns to fit the table width.
 * @property {boolean} [responsiveLayoutCollapseStartOpen] Show the collapsed column list when a row is first rendered. Defaults to true.
 * @property {boolean} [responsiveLayoutCollapseUseFormatters] Use column formatters when rendering the collapsed column list. Defaults to true.
 * @property {Function} [responsiveLayoutCollapseFormatter] Custom formatter for the collapsed column list.
 * @property {boolean} [movableColumns] Allow users to drag and reorder columns.
 * @property {"top"|"middle"|"bottom"} [columnHeaderVertAlign] Vertical alignment of column header content (used with column groups). Defaults to "top".
 * @property {"left"|"center"|"middle"|"right"} [scrollToColumnPosition] Default scroll-to-column alignment. Defaults to "left".
 * @property {boolean} [scrollToColumnIfVisible] Allow scrolling to a column that is already visible. Defaults to true.
 * @property {boolean|"true"|"above"|"below"} [columnCalcs] Where to show column calculation rows. Defaults to true.
 * @property {string|boolean} [nestedFieldSeparator] Character used to separate nested field names. Defaults to ".".
 * @property {boolean} [headerVisible] Show or hide the column header bar. Defaults to true.
 * @property {boolean} [resizableColumnGuide] Show a guide line when resizing columns.
 * @property {boolean} [resizableColumnFit] Maintain total table width when a column is resized.
 * @property {boolean} [columnHeaderSortMulti] Allow sorting by multiple columns simultaneously. Defaults to true.
 *
 * --- Rows ---
 * @property {boolean|object} [rowHeader] Column definition object for a fixed row header column; false to disable.
 * @property {number} [rowHeight] Set a fixed pixel height for all rows.
 * @property {Function|boolean} [rowFormatter] Function to customise row layout after rendering.
 * @property {Function|boolean|null} [rowFormatterPrint] Row formatter used when printing.
 * @property {Function|boolean|null} [rowFormatterClipboard] Row formatter used when copying to clipboard.
 * @property {Function|boolean|null} [rowFormatterHtmlOutput] Row formatter used by getHtml.
 * @property {"top"|"bottom"} [addRowPos] Position in the table where new rows are inserted. Defaults to "bottom".
 * @property {boolean} [movableRows] Allow users to drag and reorder rows.
 * @property {string|HTMLElement|Array} [movableRowsConnectedTables] Selector or reference to tables that can receive moved rows.
 * @property {string|Function|boolean} [movableRowsSender] Callback executed on the source table when a row is sent.
 * @property {string|Function} [movableRowsReceiver] Callback executed on the receiving table when a row arrives. Defaults to "insert".
 * @property {string|HTMLElement|boolean} [movableRowsConnectedElements] Selector or reference to non-table DOM elements that can receive moved rows.
 * @property {Function|boolean} [movableRowsElementDrop] Callback executed when a row is dropped onto a connected DOM element.
 * @property {boolean} [resizableRows] Allow users to resize row height by dragging the row edges.
 * @property {boolean} [resizableRowGuide] Show a guide line when resizing rows.
 * @property {"top"|"center"|"bottom"|"nearest"} [scrollToRowPosition] Default scroll-to-row alignment. Defaults to "top".
 * @property {boolean} [scrollToRowIfVisible] Allow scrolling to a row that is already visible. Defaults to true.
 * @property {boolean|number|Function|Array} [frozenRows] Freeze rows at the top of the table; accepts a count, field values, or a check function.
 * @property {string} [frozenRowsField] Field used to identify frozen rows when frozenRows is an array of values. Defaults to "id".
 *
 * --- Data ---
 * @property {string} [index] Field name used as the unique row index. Defaults to "id".
 * @property {any[]} [data] Initial data array to load into the table.
 * @property {string|boolean} [ajaxURL] URL for remote Ajax data loading.
 * @property {object} [ajaxParams] Parameters sent with every Ajax request.
 * @property {string|AjaxConfig} [ajaxConfig] HTTP method string or config object for Ajax requests. Defaults to "get".
 * @property {string|object} [ajaxContentType] Content-type encoding for Ajax POST requests. Defaults to "form".
 * @property {Function|boolean} [ajaxURLGenerator] Callback to dynamically generate the Ajax request URL.
 * @property {Function|boolean} [ajaxRequestFunc] Callback that replaces the built-in Ajax request handler.
 * @property {Function} [ajaxRequesting] Callback executed immediately before each Ajax request.
 * @property {Function|boolean} [ajaxResponse] Callback to pre-process the Ajax response data.
 * @property {object} [dataSendParams] Map of field names sent to the server (page, size, sorters, filters).
 * @property {object} [dataReceiveParams] Map of field names expected from the server (current_page, last_page, data).
 * @property {"local"|"remote"} [filterMode] Process filters locally or send them to the server. Defaults to "local".
 * @property {"local"|"remote"} [sortMode] Process sorters locally or send them to the server. Defaults to "local".
 * @property {boolean|"load"|"scroll"} [progressiveLoad] Progressively load data in chunks ("load" on render, "scroll" on scroll).
 * @property {number} [progressiveLoadDelay] Milliseconds to wait between progressive load requests. Defaults to 0.
 * @property {number} [progressiveLoadScrollMargin] Distance in pixels from the bottom of the table that triggers the next progressive load.
 * @property {string|Function} [importFormat] Format parser to use when importing data from a file.
 * @property {"text"|"buffer"|"binary"|"url"} [importReader] FileReader method to use when reading an import file. Defaults to "text".
 * @property {Function} [importFileValidator] Validate a file before it is imported.
 * @property {Function} [importDataValidator] Validate parsed data before it is imported.
 * @property {Function} [importHeaderTransform] Transform imported column header titles.
 * @property {Function} [importValueTransform] Transform imported cell values.
 * @property {boolean|Function} [dataLoader] Show a loading overlay while data loads; pass a function returning a boolean for dynamic control. Defaults to true.
 * @property {string} [dataLoaderLoading] HTML string for the loader element shown while data is loading.
 * @property {string} [dataLoaderError] HTML string for the loader element shown when a load error occurs.
 * @property {number} [dataLoaderErrorTimeout] Milliseconds to display the error loader before hiding it. Defaults to 3000.
 *
 * --- Sorting ---
 * @property {any[]} [initialSort] Array of sorter objects to apply when data is first loaded.
 * @property {boolean} [sortOrderReverse] Reverse the order in which multiple sorters are applied.
 * @property {string} [headerSortElement] HTML string for the sort indicator icon in column headers.
 * @property {"header"|"icon"} [headerSortClickElement] Part of the header that triggers sorting when clicked. Defaults to "header".
 *
 * --- Filtering ---
 * @property {any[]} [initialFilter] Array of filter objects to apply when data is first loaded.
 * @property {any[]} [initialHeaderFilter] Array of initial values for header filters.
 * @property {number} [headerFilterLiveFilterDelay] Milliseconds to wait after a keystroke before applying a header filter. Defaults to 300.
 * @property {string|boolean} [placeholderHeaderFilter] Placeholder text shown in empty header filter inputs.
 *
 * --- Row Grouping ---
 * @property {string|Function|Array} [groupBy] Field name, function, or array of field names to group rows by.
 * @property {any[]|boolean} [groupValues] Array of group values; restricts which groups are displayed.
 * @property {Function|Array|boolean} [groupHeader] Function or array of functions to generate group header content.
 * @property {Function|Array|null} [groupHeaderPrint] Group header formatter used when printing.
 * @property {Function|Array|null} [groupHeaderClipboard] Group header formatter used when copying to clipboard.
 * @property {Function|Array|null} [groupHeaderDownload] Group header formatter used in downloads.
 * @property {Function|Array|null} [groupHeaderHtmlOutput] Group header formatter used by getHtml.
 * @property {boolean|Function|Array} [groupStartOpen] Default open/closed state for groups. Defaults to true.
 * @property {string|boolean} [groupToggleElement] Element that triggers group visibility toggle. Defaults to "arrow".
 * @property {boolean} [groupClosedShowCalcs] Show column calculations when a group is collapsed.
 * @property {boolean} [groupUpdateOnCellEdit] Recalculate group membership when a cell is edited.
 *
 * --- Pagination ---
 * @property {boolean|string} [pagination] Enable pagination; set to true or "local"/"remote".
 * @property {"local"|"remote"} [paginationMode] Process pagination locally or on the server. Defaults to "local".
 * @property {number|boolean} [paginationSize] Number of rows per page. Defaults to false (uses default).
 * @property {boolean|any[]} [paginationSizeSelector] Add a page-size selector to the footer; pass an array of sizes.
 * @property {HTMLElement|boolean} [paginationElement] DOM element to render pagination controls into.
 * @property {"table"|"page"} [paginationAddRow] Whether new rows are appended to the table or the current page. Defaults to "page".
 * @property {number} [paginationButtonCount] Number of page buttons shown in the footer. Defaults to 5.
 * @property {number|string|Function} [paginationOutOfRange] Behaviour when the requested page exceeds the last page.
 * @property {string|Function|boolean} [paginationCounter] Content of the pagination counter element.
 * @property {HTMLElement|string|Function|boolean} [paginationCounterElement] Element to render the pagination counter into.
 * @property {number} [paginationInitialPage] Page number to display on initial load. Defaults to 1.
 *
 * --- Spreadsheet ---
 * @property {boolean} [spreadsheet] Enable spreadsheet mode.
 * @property {number} [spreadsheetRows] Number of rows in a blank spreadsheet. Defaults to 50.
 * @property {number} [spreadsheetColumns] Number of columns in a blank spreadsheet. Defaults to 50.
 * @property {object} [spreadsheetColumnDefinition] Column definition applied to all spreadsheet columns.
 * @property {boolean} [spreadsheetOutputFull] Include all rows and columns (even empty ones) in export output.
 * @property {any[]|boolean} [spreadsheetData] Initial data array for the spreadsheet.
 * @property {any[]|boolean} [spreadsheetSheets] Array of sheet definition objects for multi-sheet mode.
 * @property {boolean} [spreadsheetSheetTabs] Show sheet tabs in the table footer.
 * @property {string|HTMLElement|boolean} [spreadsheetSheetTabsElement] Alternate container element for the sheet tabs.
 *
 * --- Persistent Configuration ---
 * @property {boolean|PersistenceConfig} [persistence] Define which table state should be persisted across page loads; true persists everything.
 * @property {string} [persistenceID] Unique ID used to identify this table's persisted data.
 * @property {boolean|"local"|"cookie"} [persistenceMode] Storage mechanism for persistence. Defaults to true (localStorage).
 * @property {Function|boolean} [persistenceReaderFunc] Custom function to read persisted data.
 * @property {Function|boolean} [persistenceWriterFunc] Custom function to write persisted data.
 *
 * --- Editing ---
 * @property {"focus"|"click"|"dblclick"} [editTriggerEvent] Event that activates a cell editor. Defaults to "focus".
 * @property {any} [editorEmptyValue] Value assigned to a cell when its editor is cleared.
 * @property {Function} [editorEmptyValueFunc] Function that determines whether an edited value is considered empty.
 *
 * --- Row Selection ---
 * @property {boolean|number|"highlight"} [selectableRows] Enable row selection; "highlight" adds hover highlight only. Defaults to "highlight".
 * @property {boolean} [selectableRowsRollingSelection] Roll the selection window once the max selectable count is reached. Defaults to true.
 * @property {"drag"|"click"} [selectableRowsRangeMode] Method used to select a range of rows. Defaults to "drag".
 * @property {boolean} [selectableRowsPersistence] Maintain row selection when data is filtered or sorted. Defaults to true.
 * @property {boolean} [selectableRowsDeselectOnBlur] Deselect all rows when the user clicks outside the table. Defaults to false.
 * @property {Function} [selectableRowsCheck] Callback that determines whether a row can be selected.
 *
 * --- Range Selection ---
 * @property {boolean|number} [selectableRange] Enable cell range selection.
 * @property {boolean} [selectableRangeColumns] Allow clicking a column header to select the entire column.
 * @property {boolean} [selectableRangeRows] Allow clicking a row header to select the entire row.
 * @property {boolean} [selectableRangeClearCells] Allow clearing all values in the selected range.
 * @property {any} [selectableRangeClearCellsValue] Value that cleared range cells are set to. Defaults to undefined.
 * @property {boolean} [selectableRangeAutoFocus] Auto-focus the cell when a single-cell range is selected. Defaults to true.
 *
 * --- Clipboard ---
 * @property {boolean} [clipboard] Enable clipboard copy/paste functionality.
 * @property {boolean} [clipboardCopyStyled] Include cell formatting when copying to the clipboard. Defaults to true.
 * @property {ExportConfig|boolean} [clipboardCopyConfig] Configuration for what is included in clipboard copies.
 * @property {string|Function|boolean} [clipboardCopyRowRange] Range of rows included in clipboard copies. Defaults to "active".
 * @property {string|Function|boolean} [clipboardPasteParser] Parser used to convert pasted clipboard text into row data. Defaults to "table".
 * @property {string|Function|boolean} [clipboardPasteAction] Action to perform after parsing pasted data. Defaults to "insert".
 *
 * --- Data Tree ---
 * @property {boolean} [dataTree] Enable tree layout for hierarchical data.
 * @property {boolean} [dataTreeFilter] Apply column filters to child rows. Defaults to true.
 * @property {boolean} [dataTreeSort] Apply column sorters to child rows. Defaults to true.
 * @property {string|boolean} [dataTreeElementColumn] Column field in which to show the expand/collapse toggle.
 * @property {boolean|string|HTMLElement} [dataTreeBranchElement] Element shown as the branch connector. Defaults to true.
 * @property {number} [dataTreeChildIndent] Pixel indent applied to each child level. Defaults to 9.
 * @property {string} [dataTreeChildField] Data field that holds child row arrays. Defaults to "_children".
 * @property {boolean|string|HTMLElement} [dataTreeCollapseElement] Element used as the collapse button.
 * @property {boolean|string|HTMLElement} [dataTreeExpandElement] Element used as the expand button.
 * @property {boolean|Array|Function} [dataTreeStartExpanded] Default expansion state for tree nodes.
 * @property {boolean} [dataTreeSelectPropagate] Propagate row selection to child rows. Defaults to false.
 * @property {boolean} [dataTreeChildColumnCalcs] Include child row values in column calculations. Defaults to false.
 *
 * --- Printing ---
 * @property {boolean} [printAsHtml] Render the table as an HTML table when printing.
 * @property {boolean} [printStyled] Copy table styles to the printed HTML table. Defaults to true.
 * @property {string} [printRowRange] Range of rows included in the printed output. Defaults to "visible".
 * @property {ExportConfig} [printConfig] Choose which parts of the table are included when printing.
 * @property {boolean|string|HTMLElement|Function} [printHeader] Content to add as a header above the printed table.
 * @property {boolean|string|HTMLElement|Function} [printFooter] Content to add as a footer below the printed table.
 * @property {Function|boolean} [printFormatter] Callback to customise the print layout before printing.
 *
 * --- Menus ---
 * @property {any[]|boolean} [rowContextMenu] Context-menu items to show when right-clicking a row.
 * @property {any[]|boolean} [rowClickMenu] Menu items to show when left-clicking a row.
 * @property {any[]|boolean} [rowDblClickMenu] Menu items to show when double-clicking a row.
 * @property {any[]|boolean} [groupContextMenu] Context-menu items to show when right-clicking a group header.
 * @property {any[]|boolean} [groupClickMenu] Menu items to show when left-clicking a group header.
 * @property {any[]|boolean} [groupDblClickMenu] Menu items to show when double-clicking a group header.
 *
 * --- Popups ---
 * @property {string|HTMLElement|boolean} [rowContextPopup] Popup content shown when right-clicking a row.
 * @property {string|HTMLElement|boolean} [rowClickPopup] Popup content shown when left-clicking a row.
 * @property {string|HTMLElement|boolean} [rowDblClickPopup] Popup content shown when double-clicking a row.
 * @property {string|HTMLElement|boolean} [groupContextPopup] Popup content shown when right-clicking a group header.
 * @property {string|HTMLElement|boolean} [groupClickPopup] Popup content shown when left-clicking a group header.
 * @property {string|HTMLElement|boolean} [groupDblClickPopup] Popup content shown when double-clicking a group header.
 */

class Tabulator extends ModuleBinder {
  // default setup options
  static defaultOptions = defaultOptions

  /**
   * Extend an existing module namespace.
   * @param {...*} args Extension arguments.
   */
  static extendModule(...args) {
    Tabulator.initializeModuleBinder()
    Tabulator._extendModule(...args)
  }

  /**
   * Register a module with Tabulator.
   * @param {...*} args Module registration arguments.
   */
  static registerModule(...args) {
    Tabulator.initializeModuleBinder()
    Tabulator._registerModule(...args)
  }

  /**
   * @param {HTMLElement|string} element Target element or selector.
   * @param {Options} options Table options.
   * @param {Array<Function>} [modules] Module overrides.
   */
  constructor(element, options, modules) {
    super()

    Tabulator.initializeModuleBinder(modules)

    // Lifecycle & State
    this.options = {} // hold table options
    this.initialized = false // track if the table has been fully initialized
    this.destroyed = false // track if the table has been destroyed
    this.originalElement = null // hold original table element if it has been replaced

    // Core Managers
    this.columnManager = null // hold Column Manager
    this.rowManager = null // hold Row Manager
    this.footerManager = null // hold Footer Manager
    this.alertManager = null // hold Alert Manager
    this.dataLoader = false // hold DataLoader helper

    // Modules & Extensions
    this.modules = {} // hold all modules bound to this table
    this.modulesCore = [] // hold core modules bound to this table (for initialization purposes)
    this.modulesRegular = [] // hold regular modules bound to this table (for initialization purposes)
    this.dependencyRegistry = new DependencyRegistry(this) // hold registered dependencies
    this.componentFunctionBinder = new ComponentFunctionBinder(this) // bind component functions

    // Messaging & Events
    this.externalEvents = null // handle external event messaging
    this.eventBus = null // handle internal event messaging

    // DOM & Rendering
    this.vdomHoz = null // hold horizontal virtual DOM
    this.rtl = false // track if the table is in RTL mode
    this.interactionMonitor = false // track user interaction

    // Browser & Environment
    this.browser = '' // hold current browser type
    this.browserSlow = false // handle reduced functionality for slower browsers
    this.browserMobile = false // check if running on mobile, prevent resize cancelling edit on keyboard appearance

    // Utilities & Helpers
    this.logger = null // hold logger
    this.optionsList = new OptionsList(this, 'table constructor') // hold options list helper

    // Deferred Creation & Initialization Handlers
    this.createTimeout = null // hold setTimeout id for deferred creation
    this.windowLoadHandler = null // hold window load event listener reference

    if (this.initializeElement(element)) {
      this.initializeCoreSystems(options)

      // delay table creation to allow event bindings immediately after the constructor
      this._queueTableCreation()
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
   */
  initializeCoreSystems(options) {
    this.logger = new Logger(this)
    this.autoScroller = new AutoScroller(this)
    this.columnManager = new ColumnManager(this)
    this.rowManager = new RowManager(this)
    this.footerManager = new FooterManager(this)
    this.dataLoader = new DataLoader(this)
    this.alertManager = new Alert(this)

    this._bindModules()

    this.options = this.optionsList.generate(Tabulator.defaultOptions, options)

    this._clearObjectPointers()

    this.externalEvents = new ExternalEventBus(this, this.options, this.options.debugEventsExternal)
    this.eventBus = new InternalEventBus(this.options.debugEventsInternal)

    this.interactionMonitor = new InteractionMonitor(this)

    this.dataLoader.initialize()
    this.footerManager.initialize()

    this.dependencyRegistry.initialize()
  }

  /**
   * Defer table creation until the page and fonts are ready.
   */
  async _queueTableCreation() {
    await this._waitForPageResources()

    if (this.destroyed || this.initialized) {
      return
    }

    this.createTimeout = setTimeout(() => {
      this.createTimeout = null

      if (!this.destroyed && !this.initialized) {
        this._create()
      }
    })
  }

  /**
   * Wait for the document load event and any pending web fonts.
   * @returns {Promise<void>}
   */
  async _waitForPageResources() {
    await this._waitForWindowLoad()
    await this._waitForFonts()
  }

  /**
   * Wait for the browser load event when the document is still loading.
   * @returns {Promise<void>}
   */
  _waitForWindowLoad() {
    if (typeof document === 'undefined' || document.readyState === 'complete') {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      this.windowLoadHandler = () => {
        this.windowLoadHandler = null
        resolve()
      }

      window.addEventListener('load', this.windowLoadHandler, { once: true })
    })
  }

  /**
   * Wait for web fonts to finish loading when supported.
   * @returns {Promise<void>}
   */
  async _waitForFonts() {
    const fontSet = typeof document !== 'undefined' ? document.fonts : null

    if (!fontSet?.ready) {
      return
    }

    try {
      await fontSet.ready
    } catch {
      // Ignore font loading errors to prevent blocking table creation
    }
  }

  /**
   * Clear current browser text selection within the table.
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
   */
  _buildElement() {
    const options = this.options

    let element = this.element
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
  async _loadInitialData() {
    return this.dataLoader.load(this.options.data).finally(() => {
      this.columnManager.verticalAlignHeaders()
    })
  }

  // deconstructor
  /**
   * Destroy table instance and clean DOM/events.
   */
  destroy() {
    const element = this.element

    this.destroyed = true

    if (this.createTimeout) {
      clearTimeout(this.createTimeout)
      this.createTimeout = null
    }

    if (this.windowLoadHandler) {
      window.removeEventListener('load', this.windowLoadHandler)
      this.windowLoadHandler = null
    }

    this.constructor.registry.deregister(this) // deregister table from inter-device communication

    this.eventBus.dispatch('table-destroy')

    // unbind module event subscriptions and trigger cleanups to avoid leaks on re-create
    if (this.modules) {
      for (const key in this.modules) {
        const mod = this.modules[key]
        if (mod) {
          if (typeof mod.destroy === 'function') {
            mod.destroy()
          }
          if (typeof mod.unsubscribeAll === 'function') {
            mod.unsubscribeAll()
          }
        }
      }
    }

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
   * @param {string|false} [func] Function name, or false to auto-detect from stack.
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
  async updateData(data) {
    this.initGuard()

    this.dataLoader.blockActiveLoad()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (data && data.length > 0) {
      const promises = data.map(async (item) => {
        const row = this.rowManager.findRow(item[this.options.index])

        if (row) {
          try {
            await row.updateData(item)
          } catch {
            throw 'Update Error - Unable to update row'
          }
        } else {
          throw 'Update Error - Unable to find row'
        }
      })

      await Promise.all(promises)
    } else {
      console.warn('Update Error - No data provided')
      throw 'Update Error - No data provided'
    }
  }

  /**
   * Add multiple rows.
   * @param {Array<object>|string} data Rows to add.
   * @param {boolean|'top'|'bottom'} [pos] Insert position.
   * @param {*} [index] Index reference.
   * @returns {Promise<Array<RowComponent>>}
   */
  async addData(data, pos, index) {
    this.initGuard()

    this.dataLoader.blockActiveLoad()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (data) {
      const rows = await this.rowManager.addRows(data, pos, index)
      return rows.map((row) => row.getComponent())
    } else {
      console.warn('Update Error - No data provided')
      throw 'Update Error - No data provided'
    }
  }

  // update table data
  /**
   * Update existing rows or add missing rows.
   * @param {Array<object>|string} data Row data.
   * @returns {Promise<Array<RowComponent>>}
   */
  async updateOrAddData(data) {
    this.initGuard()

    this.dataLoader.blockActiveLoad()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (data && data.length > 0) {
      const promises = data.map(async (item) => {
        const row = this.rowManager.findRow(item[this.options.index])

        if (row) {
          await row.updateData(item)
          return row.getComponent()
        } else {
          const newRows = await this.rowManager.addRows(item)
          return newRows[0].getComponent()
        }
      })

      return Promise.all(promises)
    } else {
      console.warn('Update Error - No data provided')
      throw 'Update Error - No data provided'
    }
  }

  // get row object
  /**
   * Get row component by index/key.
   * @param {*} index Row identifier.
   * @returns {RowComponent|false}
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
   * @returns {RowComponent|false}
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
    foundRows.sort((a, b) => (this.rowManager.rows.indexOf(a) > this.rowManager.rows.indexOf(b) ? 1 : -1))

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
   * @param {boolean|'top'|'bottom'} [pos] Insert position.
   * @param {*} [index] Index reference.
   * @returns {Promise<RowComponent>}
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
   * @returns {Promise<RowComponent>}
   */
  async updateOrAddRow(index, data) {
    const row = this.rowManager.findRow(index)

    this.initGuard()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (row) {
      await row.updateData(data)
      return row.getComponent()
    } else {
      const rows = await this.rowManager.addRows(data)
      return rows[0].getComponent()
    }
  }

  // update row data
  /**
   * Update a single row.
   * @param {*} index Row identifier.
   * @param {object|string} data Row data.
   * @returns {Promise<RowComponent>}
   */
  async updateRow(index, data) {
    const row = this.rowManager.findRow(index)

    this.initGuard()

    if (typeof data === 'string') {
      data = JSON.parse(data)
    }

    if (row) {
      await row.updateData(data)
      return row.getComponent()
    } else {
      console.warn('Update Error - No matching row found:', index)
      throw 'Update Error - No matching row found'
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
   * @returns {Promise<void>}
   */
  moveRow(from, to, after) {
    const fromRow = this.rowManager.findRow(from)

    this.initGuard()

    if (fromRow) {
      return Promise.resolve(fromRow.moveToRow(to, after))
    } else {
      console.warn('Move Error - No matching row found:', from)
      return Promise.reject(new Error(`Move Error - No matching row found: ${from}`))
    }
  }

  /**
   * Get row components.
   * @param {string|boolean} [active] Row scope.
   * @returns {Array<RowComponent>}
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
   */
  setColumns(definition) {
    this.initGuard(false, "To set initial columns please use the 'columns' property in the table constructor")

    this.columnManager.setColumns(definition)
  }

  /**
   * Get column components.
   * @param {boolean} [structured] Return tree structure.
   * @returns {Array<ColumnComponent>}
   */
  getColumns(structured) {
    return this.columnManager.getComponents(structured)
  }

  /**
   * Get column component by field.
   * @param {string} field Column field.
   * @returns {ColumnComponent|false}
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
   * @returns {import('./column/ColumnComponent').ColumnDefinition[]}
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
   * @returns {Promise<ColumnComponent>}
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
   * @param {import('./column/ColumnComponent').ColumnDefinition} definition New definition.
   * @returns {Promise<ColumnComponent>}
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
   */
  redraw(force) {
    this.initGuard()

    this.columnManager.redraw(force)
    this.rowManager.redraw(force)
  }

  /**
   * Set table height and re-render vertical renderer.
   * @param {string|number} height Height value.
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
   */
  on(key, callback) {
    this.externalEvents.subscribe(key, callback)
  }

  /**
   * Unsubscribe from external event.
   * @param {string} key Event key.
   * @param {Function} callback Event callback.
   */
  off(key, callback) {
    this.externalEvents.unsubscribe(key, callback)
  }

  /**
   * Dispatch external event.
   * @param {string} key Event key.
   * @param {...*} args Callback arguments passed to event subscribers.
   */
  dispatchEvent(...args) {
    this.externalEvents.dispatch(...args)
  }

  /// ///////////////// Alerts ///////////////////

  /**
   * Show an alert.
   * @param {*} contents Alert contents.
   * @param {string} [type] Alert type.
   */
  alert(contents, type) {
    this.initGuard()

    this.alertManager.alert(contents, type)
  }

  /**
   * Clear active alert.
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
   * @returns {object|undefined}
   */
  module(key) {
    const mod = this.modules[key]

    if (!mod) {
      console.error('Tabulator module not installed: ' + key)
    }

    return mod
  }

  _noop() {
    // no-op to consume stub arguments for ESLint
  }

  /**
   * Copy table data to clipboard.
   * @param {string} [rowRangeLookup] Range of rows to copy.
   */
  copyToClipboard(rowRangeLookup) {
    this.initGuard()
    this._noop(rowRangeLookup)
    throw new Error('Clipboard module is not installed.')
  }

  /**
   * Get the current AJAX URL of the table.
   * @returns {string} The AJAX URL.
   */
  getAjaxUrl() {
    this.initGuard()
    throw new Error('Ajax module is not installed.')
  }

  /**
   * Retrieve an array of row components that match the filters.
   * @param {string} field Filter field.
   * @param {string} type Filter type.
   * @param {*} value Filter value.
   * @returns {RowComponent[]} Matching row components.
   */
  searchRows(field, type, value) {
    this.initGuard()
    this._noop(field, type, value)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Retrieve an array of table row data that match the filters.
   * @param {string} field Filter field.
   * @param {string} type Filter type.
   * @param {*} value Filter value.
   * @returns {any[]} Matching row data.
   */
  searchData(field, type, value) {
    this.initGuard()
    this._noop(field, type, value)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Set filters on the table.
   * @param {string|Function} field Filter field or function.
   * @param {string} [type] Filter operator.
   * @param {*} [value] Filter value.
   * @param {object} [filterParams] Filter parameters.
   */
  setFilter(field, type, value, filterParams) {
    this.initGuard()
    this._noop(field, type, value, filterParams)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Refresh active filters.
   */
  refreshFilter() {
    this.initGuard()
    throw new Error('Filter module is not installed.')
  }

  /**
   * Add a filter.
   * @param {string|Function} field Filter field or function.
   * @param {string} [type] Filter operator.
   * @param {*} [value] Filter value.
   * @param {object} [filterParams] Filter parameters.
   */
  addFilter(field, type, value, filterParams) {
    this.initGuard()
    this._noop(field, type, value, filterParams)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Get all active filters.
   * @param {boolean} [allFilters] Include header filters.
   * @returns {any[]} Active filters.
   */
  getFilters(allFilters) {
    this.initGuard()
    this._noop(allFilters)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Focus header filter on target column.
   * @param {string} field Column field.
   */
  setHeaderFilterFocus(field) {
    this.initGuard()
    this._noop(field)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Get value of header filter.
   * @param {string} field Column field.
   * @returns {*}
   */
  getHeaderFilterValue(field) {
    this.initGuard()
    this._noop(field)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Set value of header filter.
   * @param {string} field Column field.
   * @param {*} value Filter value.
   */
  setHeaderFilterValue(field, value) {
    this.initGuard()
    this._noop(field, value)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Get all header filters.
   * @returns {any[]} Header filters.
   */
  getHeaderFilters() {
    this.initGuard()
    throw new Error('Filter module is not installed.')
  }

  /**
   * Remove a filter.
   * @param {string|Function} field Filter field or function.
   * @param {string} [type] Filter operator.
   * @param {*} [value] Filter value.
   * @param {object} [filterParams] Filter parameters.
   */
  removeFilter(field, type, value, filterParams) {
    this.initGuard()
    this._noop(field, type, value, filterParams)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Clear all filters.
   * @param {boolean} [all] Clear header filters as well.
   */
  clearFilter(all) {
    this.initGuard()
    this._noop(all)
    throw new Error('Filter module is not installed.')
  }

  /**
   * Clear all header filters.
   */
  clearHeaderFilter() {
    this.initGuard()
    throw new Error('Filter module is not installed.')
  }

  /**
   * Change group by option.
   * @param {string|string[]|Function} groupBy Grouping fields or function.
   */
  setGroupBy(groupBy) {
    this.initGuard()
    this._noop(groupBy)
    throw new Error('GroupRows module is not installed.')
  }

  /**
   * Explicitly define group values.
   * @param {any[]} groupValues Acceptable group values.
   */
  setGroupValues(groupValues) {
    this.initGuard()
    this._noop(groupValues)
    throw new Error('GroupRows module is not installed.')
  }

  /**
   * Change group start open option.
   * @param {boolean|boolean[]|Function} groupStartOpen Initial open state or handler.
   */
  setGroupStartOpen(groupStartOpen) {
    this.initGuard()
    this._noop(groupStartOpen)
    throw new Error('GroupRows module is not installed.')
  }

  /**
   * Change group header formatter.
   * @param {Function|Function[]} groupHeader Header formatter or handler.
   */
  setGroupHeader(groupHeader) {
    this.initGuard()
    this._noop(groupHeader)
    throw new Error('GroupRows module is not installed.')
  }

  /**
   * Get group components.
   * @returns {any[]} Group components.
   */
  getGroups() {
    this.initGuard()
    throw new Error('GroupRows module is not installed.')
  }

  /**
   * Get grouped data.
   * @returns {any[]} Grouped data.
   */
  getGroupedData() {
    this.initGuard()
    throw new Error('GroupRows module is not installed.')
  }

  /**
   * Undo last action.
   * @returns {boolean} True if successful.
   */
  undo() {
    this.initGuard()
    throw new Error('History module is not installed.')
  }

  /**
   * Redo last action.
   * @returns {boolean} True if successful.
   */
  redo() {
    this.initGuard()
    throw new Error('History module is not installed.')
  }

  /**
   * Get number of undo actions.
   * @returns {number|false} Count or false.
   */
  getHistoryUndoSize() {
    this.initGuard()
    throw new Error('History module is not installed.')
  }

  /**
   * Get number of redo actions.
   * @returns {number|false} Count or false.
   */
  getHistoryRedoSize() {
    this.initGuard()
    throw new Error('History module is not installed.')
  }

  /**
   * Clear history log.
   */
  clearHistory() {
    this.initGuard()
    throw new Error('History module is not installed.')
  }

  /**
   * Get range data.
   * @returns {any[]} Range data.
   */
  getRangesData() {
    this.initGuard()
    throw new Error('SelectRange module is not installed.')
  }

  /**
   * Get range components.
   * @returns {any[]} Range components.
   */
  getRanges() {
    this.initGuard()
    throw new Error('SelectRange module is not installed.')
  }

  /**
   * Add a range.
   * @param {any} range Range bounds.
   */
  addRange(range) {
    this.initGuard()
    this._noop(range)
    throw new Error('SelectRange module is not installed.')
  }

  /**
   * Get simple HTML representation of the table.
   * @param {string} [rowRangeLookup] Range of rows.
   * @param {boolean} [style] Include styling.
   * @param {object} [config] Configuration.
   * @returns {string} HTML string.
   */
  getHtml(rowRangeLookup, style, config) {
    this.initGuard()
    this._noop(rowRangeLookup, style, config)
    throw new Error('Export module is not installed.')
  }

  /**
   * Get persistent layout config.
   * @returns {any[]} Layout configuration.
   */
  getColumnLayout() {
    this.initGuard()
    throw new Error('Persistence module is not installed.')
  }

  /**
   * Load persistent layout config.
   * @param {any[]} layout Layout configuration.
   */
  setColumnLayout(layout) {
    this.initGuard()
    this._noop(layout)
    throw new Error('Persistence module is not installed.')
  }

  /**
   * Load data from a file.
   * @param {*} data File data/source.
   * @param {string|string[]} extension Extensions allowed.
   * @param {"buffer" | "binary" | "url" | "text"} [format] Input format.
   * @returns {Promise<void>}
   */
  import(data, extension, format) {
    this.initGuard()
    this._noop(data, extension, format)
    throw new Error('Import module is not installed.')
  }

  /**
   * Print fullscreen view of the table.
   * @param {string} [rowRangeLookup] Range of rows.
   * @param {boolean} [style] Include styling.
   * @param {object} [config] Configuration.
   */
  print(rowRangeLookup, style, config) {
    this.initGuard()
    this._noop(rowRangeLookup, style, config)
    throw new Error('Print module is not installed.')
  }

  /**
   * Set active locale.
   * @param {string} locale Locale key.
   */
  setLocale(locale) {
    this.initGuard()
    this._noop(locale)
    throw new Error('Localize module is not installed.')
  }

  /**
   * Get active locale.
   * @returns {string} Active locale key.
   */
  getLocale() {
    this.initGuard()
    throw new Error('Localize module is not installed.')
  }

  /**
   * Get translation dictionary for locale.
   * @param {string} [locale] Locale key.
   * @returns {object} Language dictionary.
   */
  getLang(locale) {
    this.initGuard()
    this._noop(locale)
    throw new Error('Localize module is not installed.')
  }

  /**
   * Get all edited cell components.
   * @returns {import('./cell/CellComponent').default[]} Edited cells.
   */
  getEditedCells() {
    this.initGuard()
    throw new Error('Edit module is not installed.')
  }

  /**
   * Clear edited flags.
   * @param {import('./cell/CellComponent').default|import('./cell/CellComponent').default[]} [clear] Cell(s) to clear.
   */
  clearCellEdited(clear) {
    this.initGuard()
    this._noop(clear)
    throw new Error('Edit module is not installed.')
  }

  /**
   * Trigger download of table data.
   * @param {string|Function} downloadType File type or custom download function.
   * @param {string} fileName File name.
   * @param {object} [params] Additional parameters.
   * @param {string} [filter] Row range lookup.
   */
  download(downloadType, fileName, params, filter) {
    this.initGuard()
    this._noop(downloadType, fileName, params, filter)
    throw new Error('Download module is not installed.')
  }

  /**
   * Open downloaded file in new browser tab.
   * @param {string} downloadType File type.
   * @param {string} fileName File name.
   * @param {object} [params] Additional parameters.
   */
  downloadToTab(downloadType, fileName, params) {
    this.initGuard()
    this._noop(downloadType, fileName, params)
    throw new Error('Download module is not installed.')
  }

  /**
   * Comms messaging handler.
   * @param {HTMLElement} table Source table element.
   * @param {string} module Target module name.
   * @param {string} action Target action name.
   * @param {*} data Message payload.
   */
  tableComms(table, module, action, data) {
    this.initGuard()
    this._noop(table, module, action, data)
    throw new Error('Comms module is not installed.')
  }

  /**
   * Set active spreadsheet sheets.
   * @param {Array<object>} sheets Sheet definitions.
   * @returns {Array<object>}
   */
  setSheets(sheets) {
    this.initGuard()
    this._noop(sheets)
    throw new Error('Spreadsheet module is not installed.')
  }

  /**
   * Add active spreadsheet sheet.
   * @param {object} sheet Sheet definition.
   * @returns {object}
   */
  addSheet(sheet) {
    this.initGuard()
    this._noop(sheet)
    throw new Error('Spreadsheet module is not installed.')
  }
}

export default Tabulator
