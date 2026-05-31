/**
 * Type definitions for Tabulator.
 *
 * @module core/types
 */

/**
 * @typedef {string | ((values: any[], data: any[], calcParams: object) => any)} ColumnCalc
 */

/**
 * @typedef {object} ColumnCalcParams
 * @property {number} [precision]
 */

/**
 * @typedef {string | ((cell: import('./cell/CellComponent').default, formatterParams: object, onRendered: Function) => any)} Formatter
 */

/**
 * @typedef {string | boolean | ((cell: import('./cell/CellComponent').default, onRendered: Function, success: Function, cancel: Function, editorParams: object) => HTMLElement | false)} Editor
 */

/**
 * @typedef {string | ((cell: import('./cell/CellComponent').default, value: any, parameters: object) => boolean)} Validator
 */

/**
 * @typedef {string | ((a: any, b: any, aRow: import('./row/RowComponent').default, bRow: import('./row/RowComponent').default, column: import('./column/ColumnComponent').default, dir: string, sorterParams: object) => number)} Sorter
 */

/**
 * @typedef {string | ((data: any, filterParams: object) => boolean)} Filter
 */

/**
 * @typedef {string | ((values: any[], data: any[]) => any)} GroupArg
 */

/**
 * @typedef {"visible" | "active" | "selected" | "all" | "range"} RowRangeLookup
 */

/**
 * @typedef {object} ColumnDefinition
 * @property {string} [title] - Column title
 * @property {string} [field] - Column field binding
 * @property {ColumnDefinition[]} [columns] - Sub columns (grouped columns)
 * @property {boolean} [visible] - Column visibility
 * @property {string|number} [width] - Column width
 * @property {number} [minWidth] - Column min width
 * @property {number} [maxWidth] - Column max width
 * @property {number} [widthGrow] - Width grow factor
 * @property {number} [widthShrink] - Width shrink factor
 * @property {boolean} [resizable] - Column resizable
 * @property {boolean|"top"|"bottom"} [frozen] - Freeze column
 * @property {boolean|number} [responsive] - Responsive layout priority
 * @property {"left"|"center"|"right"|"justify"} [hozAlign] - Horizontal alignment
 * @property {"top"|"middle"|"bottom"} [vertAlign] - Vertical alignment
 * @property {ColumnCalc} [bottomCalc] - Bottom calculation type
 * @property {ColumnCalcParams|Function} [bottomCalcParams] - Bottom calculation params
 * @property {Formatter} [bottomCalcFormatter] - Bottom calculation formatter
 * @property {object|Function} [bottomCalcFormatterParams] - Bottom calculation formatter params
 * @property {ColumnCalc} [topCalc] - Top calculation type
 * @property {ColumnCalcParams|Function} [topCalcParams] - Top calculation params
 * @property {Formatter} [topCalcFormatter] - Top calculation formatter
 * @property {object|Function} [topCalcFormatterParams] - Top calculation formatter params
 * @property {boolean} [headerSort] - Enable sorting by clicking header
 * @property {"asc"|"desc"} [headerSortStartingDir] - Starting sort direction
 * @property {boolean} [headerSortTristate] - Enable tristate sorting
 * @property {Editor} [editor] - Cell editor
 * @property {object|Function} [editorParams] - Cell editor params
 * @property {string} [editorPlaceholder] - Editor placeholder
 * @property {Formatter} [formatter] - Cell formatter
 * @property {object|Function} [formatterParams] - Cell formatter params
 * @property {Validator} [validator] - Cell validator
 * @property {Function} [click] - Column header click event
 * @property {Function} [dblclick] - Column header double click event
 * @property {Function} [contextMenu] - Column header context menu event
 * @property {boolean} [rowHandle] - Display row handle
 * @property {boolean} [hideInHtml] - Hide in HTML output
 * @property {boolean} [rowHeader] - Use as row header
 * @property {boolean} [searchable] - Searchable column
 * @property {Sorter} [sorter] - Column sorter
 * @property {object|Function} [sorterParams] - Column sorter params
 */

/**
 * @typedef {object} Options
 * @property {any[]} [data] - Array of data objects
 * @property {boolean|"full"} [autoColumns] - Auto generate columns
 * @property {Function|object} [autoColumnsDefinitions] - Auto column definitions
 * @property {ColumnDefinition[]} [columns] - Column definitions
 * @property {string|number} [height] - Table height
 * @property {string|number} [minHeight] - Table min height
 * @property {string|number} [maxHeight] - Table max height
 * @property {"fitData"|"fitColumns"|"fitDataFill"|"fitDataStretch"|"fitDataTable"} [layout] - Layout mode
 * @property {boolean} [layoutColumnsOnNewData] - Adjust column widths on new data
 * @property {"hide"|"collapse"|boolean} [responsiveLayout] - Responsive layout mode
 * @property {boolean} [responsiveLayoutCollapseStartOpen] - Expand collapsed rows by default
 * @property {Function} [responsiveLayoutCollapseFormatter] - Collapsed row formatter
 * @property {object} [columnDefaults] - Default column properties
 * @property {boolean} [headerVisible] - Toggle header visibility
 * @property {boolean|Function|string} [rowHeader] - Toggle row header
 * @property {"auto"|"ltr"|"rtl"} [textDirection] - Text direction
 * @property {"top"|"center"|"bottom"|"nearest"} [scrollToRowPosition] - Scroll to row position
 * @property {boolean} [scrollToRowIfVisible] - Scroll to row if visible
 * @property {"left"|"center"|"middle"|"right"} [scrollToColumnPosition] - Scroll to column position
 * @property {boolean} [scrollToColumnIfVisible] - Scroll to column if visible
 * @property {Function} [rowFormatter] - Custom row formatter
 * @property {Function} [rowFormatterPrint] - Custom print row formatter
 * @property {Function} [rowFormatterClipboard] - Custom clipboard row formatter
 * @property {Function} [rowFormatterHtmlOutput] - Custom HTML output row formatter
 * @property {string|HTMLElement|Function} [placeholder] - Placeholder element or text
 * @property {boolean|string|HTMLElement} [footerElement] - Footer element or selector
 * @property {string|number} [index] - Primary key field name
 * @property {object} [keybindings] - Keybindings map
 * @property {boolean|"copy"|"paste"|string} [clipboard] - Clipboard mode
 * @property {boolean} [clipboardCopyStyled] - Copy styled text to clipboard
 * @property {object} [clipboardCopyConfig] - Clipboard copy configuration
 * @property {string|Function} [clipboardCopyFormatter] - Clipboard copy formatter
 * @property {boolean} [clipboardCopyHeader] - Include headers in clipboard copy
 * @property {string|Function} [clipboardPasteParser] - Clipboard paste parser
 * @property {string|Function} [clipboardPasteAction] - Clipboard paste action
 * @property {boolean} [dataTree] - Enable data tree
 * @property {string} [dataTreeChildField] - Data tree child field
 * @property {number} [dataTreeChildIndent] - Data tree child indent
 * @property {boolean|string|HTMLElement} [dataTreeBranchElement] - Data tree branch element
 * @property {boolean|string|HTMLElement} [dataTreeCollapseElement] - Data tree collapse element
 * @property {boolean|string|HTMLElement} [dataTreeExpandElement] - Data tree expand element
 * @property {boolean} [dataTreeStartExpanded] - Expand data tree by default
 * @property {boolean} [dataTreeChildColumnCalcs] - Child column calculations
 * @property {boolean} [dataTreeSelectPropagate] - Propagate select events
 * @property {string|number|boolean} [dataTreeElementColumn] - Data tree element column
 * @property {boolean} [dataTreeFilter] - Filter data tree
 * @property {boolean} [dataTreeSort] - Sort data tree
 * @property {boolean|"reorder"} [movableRows] - Enable movable rows
 * @property {string|HTMLElement|any[]} [movableRowsConnectedTables] - Connected tables for row movement
 * @property {string|Function} [movableRowsSender] - Movable rows sender
 * @property {string|Function} [movableRowsReceiver] - Movable rows receiver
 * @property {string} [movableRowsElement] - Movable rows element selector
 * @property {boolean} [movableRowsSourceShowHeaders] - Show headers on source
 * @property {boolean} [movableRowsTargetShowHeaders] - Show headers on target
 * @property {string} [movableRowsSourceTitle] - Source table title
 * @property {string} [movableRowsTargetTitle] - Target table title
 * @property {object} [movableRowsConnectedTablesOptions] - Connected tables options
 * @property {object} [movableRowsConnectedTablesParams] - Connected tables params
 * @property {boolean} [movableColumns] - Enable movable columns
 * @property {boolean} [movableColumnsElement] - Movable columns element
 * @property {string} [columnHeaderVertAlign] - Column header vertical alignment
 * @property {string|boolean} [nestedFieldSeparator] - Nested field separator
 * @property {Function} [validationFailed] - Validation failed callback
 * @property {object} [validationFailedParams] - Validation failed params
 * @property {boolean} [history] - Enable history
 * @property {boolean|number|"highlight"} [selectable] - Enable selectable rows
 * @property {"click"|"checkbox"} [selectableRangeMode] - Selectable range mode
 * @property {boolean|number} [selectableRows] - Enable selectable rows
 * @property {"click"|"checkbox"} [selectableRowsRangeMode] - Selectable rows range mode
 * @property {boolean} [selectableRowsRollingSelection] - Rolling selection
 * @property {boolean} [selectableRowsPersistence] - Persist selections
 * @property {Function} [selectableRowsCheck] - Row selectable check callback
 * @property {object} [selectableRowsCheckParams] - Check parameters
 * @property {boolean} [selectRowHighlight] - Highlight selected rows
 * @property {boolean|"remote"|"local"} [pagination] - Pagination mode
 * @property {number} [paginationSize] - Pagination size
 * @property {boolean|any[]} [paginationSizeSelector] - Pagination size selector
 * @property {string|HTMLElement} [paginationElement] - Pagination element
 * @property {number} [paginationButtonCount] - Pagination button count
 * @property {string|Function} [paginationCounter] - Pagination counter
 * @property {string|HTMLElement|Function} [paginationCounterElement] - Pagination counter element
 * @property {boolean|object} [persistence] - Enable persistence
 * @property {Function|string} [persistenceReader] - Persistence reader
 * @property {Function|string} [persistenceWriter] - Persistence writer
 * @property {object} [persistenceConfig] - Persistence configuration
 * @property {string} [persistenceID] - Persistence ID
 * @property {"local"|"cookie"|"server"} [persistenceMode] - Persistence mode
 * @property {string} [ajaxURL] - Ajax URL
 * @property {object} [ajaxParams] - Ajax params
 * @property {object} [ajaxConfig] - Ajax config
 * @property {string|object} [ajaxContentType] - Ajax content type
 * @property {Function} [ajaxURLGenerator] - Ajax URL generator
 * @property {Function} [ajaxRequestFunc] - Ajax request function
 * @property {Function} [ajaxResponse] - Ajax response handler
 * @property {Function} [ajaxError] - Ajax error handler
 * @property {boolean} [ajaxFiltering] - Enable ajax filtering
 * @property {boolean} [ajaxSorting] - Enable ajax sorting
 * @property {"default"|"load"|"scroll"} [ajaxProgressive] - Ajax progressive mode
 * @property {number} [ajaxProgressiveDelay] - Ajax progressive delay
 * @property {Function} [ajaxProgressiveLoad] - Ajax progressive load handler
 * @property {number} [ajaxProgressiveLoadDelay] - Ajax progressive load delay
 * @property {boolean|Function} [ajaxLoader] - Show ajax loader
 * @property {string|HTMLElement|Function} [ajaxLoaderLoading] - Loading element or text
 * @property {string|HTMLElement|Function} [ajaxLoaderError] - Error element or text
 * @property {number} [ajaxLoaderErrorTimeout] - Error timeout
 * @property {any[]} [initialSort] - Initial sort configuration
 * @property {any[]} [initialFilter] - Initial filter configuration
 * @property {any[]} [initialHeaderFilter] - Initial header filter configuration
 * @property {boolean} [sortOrderReverse] - Reverse sort order
 * @property {number} [headerFilterLiveFilterDelay] - Header filter live filter delay
 * @property {object} [langs] - Languages object
 * @property {string} [locale] - Active locale
 * @property {object} [downloadConfig] - Download configuration
 * @property {Function} [downloadEncoder] - Download encoder
 * @property {Function} [downloadReady] - Download ready callback
 * @property {Function} [downloadComplete] - Download complete callback
 * @property {boolean} [debugEventsExternal] - Debug external events
 * @property {boolean} [debugEventsInternal] - Debug internal events
 * @property {boolean} [debugInitialization] - Debug initialization
 * @property {boolean} [debugInvalidOptions] - Debug invalid options
 * @property {boolean} [debugInvalidComponentFuncs] - Debug invalid component functions
 * @property {boolean} [debugLogging] - Enable debug logging
 * @property {boolean} [debugDeprecation] - Enable deprecation warnings
 */

export {}
