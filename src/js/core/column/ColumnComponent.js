// public column object
/** @typedef {import('../Tabulator').default} Tabulator */
/** @typedef {import('../cell/CellComponent').default} CellComponent */
/** @typedef {import('../../modules/SelectRange/RangeComponent').default} RangeComponent */
/** @typedef {import('../../modules/ColumnCalcs/ColumnCalcs').ColumnCalc} ColumnCalc */
/** @typedef {import('../../modules/ColumnCalcs/ColumnCalcs').ColumnCalcParams} ColumnCalcParams */
/** @typedef {import('../../modules/Format/Format').Formatter} Formatter */
/** @typedef {import('../../modules/Edit/Edit').Editor} Editor */
/** @typedef {import('../../modules/Validate/Validate').Validator} Validator */
/** @typedef {import('../../modules/Sort/Sort').Sorter} Sorter */
/** @typedef {import('../../modules/Mutator/Mutator').Mutator} Mutator */
/** @typedef {import('../../modules/Accessor/Accessor').Accessor} Accessor */

/**
 * @typedef {object} MoneyFormatterParams
 * @property {string} [decimal] Symbol used as the decimal point (default '.').
 * @property {string} [thousand] Symbol used as the thousand separator (default ',').
 * @property {string} [symbol] Currency symbol placed before or after the number.
 * @property {boolean} [symbolAfter] Place the currency symbol after the number instead of before.
 * @property {boolean} [negativeSign] Use a minus sign for negative values instead of parentheses.
 * @property {number|boolean} [precision] Number of decimal places (default 2); false keeps value as-is.
 */

/**
 * @typedef {object} ImageFormatterParams
 * @property {string} [height] CSS height for the image element.
 * @property {string} [width] CSS width for the image element.
 * @property {string} [urlPrefix] String prepended to the cell value to form the image URL.
 * @property {string} [urlSuffix] String appended to the cell value to form the image URL.
 * @property {object} [elementAttributes] Attributes to set on the img element.
 */

/**
 * @typedef {object} LinkFormatterParams
 * @property {string} [labelField] Row data field used as the link label.
 * @property {string|Function} [label] Fixed string or function returning the link label.
 * @property {string} [urlPrefix] String prepended to the cell value to form the URL.
 * @property {string} [urlField] Row data field used as the URL.
 * @property {string|Function} [url] Fixed string or function returning the URL.
 * @property {string} [target] Value for the link's target attribute (e.g. '_blank').
 * @property {boolean|string} [download] Set the download attribute; true uses the filename from the URL.
 */

/**
 * @typedef {object} DatetimeFormatterParams
 * @property {string} [inputFormat] Luxon format string for parsing the input value (default 'yyyy-MM-dd HH:mm:ss'), or 'iso' for ISO 8601.
 * @property {string} [outputFormat] Luxon format string for the displayed output (default 'dd/MM/yyyy HH:mm:ss').
 * @property {string|boolean|Function} [invalidPlaceholder] Value shown when the cell value cannot be parsed; true shows the original value.
 * @property {string} [timezone] IANA timezone string used when parsing/displaying the date.
 */

/**
 * @typedef {object} DatetimediffFormatterParams
 * @property {string} [inputFormat] Luxon format string for parsing the cell value (default 'yyyy-MM-dd HH:mm:ss'), or 'iso' for ISO 8601.
 * @property {boolean} [humanize] Display the difference in a humanized form (e.g. '2 days ago').
 * @property {string|string[]} [unit] Time unit for the difference; array allowed when humanize is true (default 'seconds').
 * @property {boolean} [suffix] Append an 'ago' or 'from now' suffix.
 * @property {object} [date] Reference luxon DateTime to compare against (defaults to now).
 * @property {string} [invalidPlaceholder] Placeholder shown when the cell value cannot be parsed.
 * @property {string} [timezone] IANA timezone string used when parsing the date.
 */

/**
 * @typedef {object} TickCrossFormatterParams
 * @property {boolean} [allowEmpty] Show an empty cell instead of a cross for empty values (default false).
 * @property {boolean} [allowTruthy] Show a tick for any truthy value (default false).
 * @property {string|boolean} [tickElement] Custom HTML for the tick; false hides ticks.
 * @property {string|boolean} [crossElement] Custom HTML for the cross; false hides crosses.
 */

/**
 * @typedef {object} ArrayFormatterParams
 * @property {string} [delimiter] Character used to join array values (default '|').
 * @property {string|Function} [valueMap] Dot-notation path or function to extract a value from each array item.
 */

/**
 * @typedef {object} JsonFormatterParams
 * @property {boolean} [multiline] Pretty-print across multiple lines (default true).
 * @property {string} [indent] Indent character for object properties (default '\t').
 * @property {any[]|Function} [replacer] The replacer argument for JSON.stringify.
 */

/**
 * @typedef {object} StarFormatterParams
 * @property {number} [stars] Maximum number of stars to display (default 5).
 */

/**
 * @typedef {object} TrafficFormatterParams
 * @property {number} [min] Minimum value for the colour scale (default 0).
 * @property {number} [max] Maximum value for the colour scale (default 100).
 * @property {string|string[]|Function} [color] CSS colour string, array of colours, or function returning a colour.
 */

/**
 * @typedef {object} ProgressFormatterParams
 * @property {number} [min] Minimum value for the progress bar (default 0).
 * @property {number} [max] Maximum value for the progress bar (default 100).
 * @property {string|string[]|Function} [color] CSS colour, array of colours, or function returning a colour for the bar fill.
 * @property {string|boolean|Function} [legend] Text label on the bar; true shows the percentage.
 * @property {string|string[]|Function} [legendColor] CSS colour for the legend text.
 * @property {"left"|"center"|"right"|"justify"} [legendAlign] Horizontal alignment of the legend text.
 */

/**
 * @typedef {object} ToggleFormatterParams
 * @property {number} [size] Size of the switch in pixels (default 15).
 * @property {any} [onValue] Cell value representing the on state (default true).
 * @property {any} [offValue] Cell value representing the off state (default false).
 * @property {boolean} [onTruthy] Treat any truthy value as the on state (default false).
 * @property {string} [onColor] CSS colour of the switch in the on state.
 * @property {string} [offColor] CSS colour of the switch in the off state.
 * @property {boolean} [clickable] Allow clicking the switch to toggle the cell value.
 */

/**
 * @typedef {object} AdaptableFormatterParams
 * @property {Function} [formatterLookup] Function passed the CellComponent; must return the formatter to use.
 * @property {object|Function} [paramsLookup] Object keyed by formatter name with params, or function returning params for the chosen formatter.
 */

/**
 * @typedef {MoneyFormatterParams|ImageFormatterParams|LinkFormatterParams|DatetimeFormatterParams|DatetimediffFormatterParams|TickCrossFormatterParams|ArrayFormatterParams|JsonFormatterParams|StarFormatterParams|TrafficFormatterParams|ProgressFormatterParams|ToggleFormatterParams|AdaptableFormatterParams|object} FormatterParams
 */

/**
 * @typedef {object} StringSorterParams
 * @property {string|boolean} [locale] BCP 47 language tag for locale-aware sorting, or true to use the browser default locale.
 * @property {"top"|"bottom"} [alignEmptyValues] Whether to sort empty values to the top or bottom.
 */

/**
 * @typedef {object} NumberSorterParams
 * @property {string} [decimal] Character representing the decimal point (default '.').
 * @property {"top"|"bottom"} [alignEmptyValues] Whether to sort empty values to the top or bottom.
 */

/**
 * @typedef {object} DateSorterParams
 * @property {string} [format] Date format string for parsing (default 'DD/MM/YYYY').
 * @property {"top"|"bottom"} [alignEmptyValues] Whether to sort empty values to the top or bottom.
 */

/**
 * @typedef {object} TimeSorterParams
 * @property {string} [format] Time format string for parsing (default 'hh:mm').
 * @property {"top"|"bottom"} [alignEmptyValues] Whether to sort empty values to the top or bottom.
 */

/**
 * @typedef {object} DatetimeSorterParams
 * @property {string} [format] Datetime format string for parsing.
 * @property {"top"|"bottom"} [alignEmptyValues] Whether to sort empty values to the top or bottom.
 */

/**
 * @typedef {object} ArraySorterParams
 * @property {"length"|"sum"|"max"|"min"|"avg"} [type] How to derive the sort value from the array.
 * @property {"top"|"bottom"} [alignEmptyValues] Whether to sort empty values to the top or bottom.
 */

/**
 * @typedef {object} AlignEmptySorterParams
 * @property {"top"|"bottom"} [alignEmptyValues] Whether to sort empty values to the top or bottom.
 */

/**
 * @typedef {StringSorterParams|NumberSorterParams|DateSorterParams|TimeSorterParams|DatetimeSorterParams|ArraySorterParams|AlignEmptySorterParams|object} SorterParams
 */

/**
 * @typedef {object} InputEditorParams
 * @property {boolean} [search] Use a search-type input instead of text.
 * @property {string} [mask] Input mask string — A=letter, 9=number, *=any character.
 * @property {boolean} [maskAutoFill] Auto-fill mask literal characters as the user types.
 * @property {string} [maskLetterChar] Character representing a letter in the mask (default 'A').
 * @property {string} [maskNumberChar] Character representing a number in the mask (default '9').
 * @property {string} [maskWildcardChar] Character representing a wildcard in the mask (default '*').
 * @property {boolean} [selectContents] Select the cell contents when the editor opens.
 * @property {object} [elementAttributes] HTML attributes to set on the input element.
 */

/**
 * @typedef {object} TextareaEditorParams
 * @property {string} [mask] Input mask string.
 * @property {boolean} [maskAutoFill] Auto-fill mask literal characters as the user types.
 * @property {boolean} [selectContents] Select the cell contents when the editor opens.
 * @property {"hybrid"|"editor"|"table"} [verticalNavigation] How up/down arrow keys navigate.
 * @property {boolean} [shiftEnterSubmit] Submit the edit when Shift+Enter is pressed.
 * @property {object} [elementAttributes] HTML attributes to set on the textarea element.
 */

/**
 * @typedef {object} NumberEditorParams
 * @property {number} [min] Minimum allowed value.
 * @property {number} [max] Maximum allowed value.
 * @property {number} [step] Increment step size (default 1).
 * @property {string} [mask] Input mask string.
 * @property {boolean} [maskAutoFill] Auto-fill mask literal characters as the user types.
 * @property {boolean} [selectContents] Select the cell contents when the editor opens.
 * @property {"hybrid"|"editor"|"table"} [verticalNavigation] How up/down arrow keys navigate.
 * @property {object} [elementAttributes] HTML attributes to set on the input element.
 */

/**
 * @typedef {object} RangeEditorParams
 * @property {number} [min] Minimum value for the slider.
 * @property {number} [max] Maximum value for the slider.
 * @property {number} [step] Increment step size.
 * @property {object} [elementAttributes] HTML attributes to set on the range input element.
 */

/**
 * @typedef {object} TickCrossEditorParams
 * @property {boolean} [tristate] Allow a third indeterminate null state.
 * @property {any} [indeterminateValue] Data value assigned to the indeterminate state (default null).
 * @property {any} [trueValue] Data value assigned to the ticked state (default true).
 * @property {any} [falseValue] Data value assigned to the crossed state (default false).
 * @property {object} [elementAttributes] HTML attributes to set on the checkbox element.
 */

/**
 * @typedef {object} StarEditorParams
 * @property {number} [stars] Maximum number of stars to display (default 5).
 */

/**
 * @typedef {object} ListEditorParams
 * @property {any[]|object|Function} [values] List of values. Array of strings, array of {label,value} objects, or a function returning either.
 * @property {string} [valuesURL] URL to fetch list values from.
 * @property {"active"|"all"|Function} [valuesLookup] Look up values from existing column data.
 * @property {string} [valuesLookupField] Column field to use when performing a valuesLookup.
 * @property {boolean} [clearable] Allow the selected value to be cleared.
 * @property {Function} [itemFormatter] Function to format individual list items.
 * @property {"asc"|"desc"} [sort] Sort order for the list items.
 * @property {any} [emptyValue] Data value used for an empty selection.
 * @property {boolean|number} [multiselect] Allow multiple selections; integer limits the count.
 * @property {boolean} [autocomplete] Enable autocomplete filtering as the user types.
 * @property {Function} [filterFunc] Custom function to filter list items.
 * @property {number} [filterDelay] Milliseconds to wait after a keystroke before filtering.
 * @property {boolean} [allowEmpty] Allow an empty string as a valid selection.
 * @property {boolean} [listOnEmpty] Show the full list when the autocomplete input is empty.
 * @property {boolean} [freetext] Allow the user to enter a value not in the list.
 * @property {object} [elementAttributes] HTML attributes to set on the input element.
 * @property {"hybrid"|"editor"|"table"} [verticalNavigation] How up/down arrow keys navigate when the list is closed.
 */

/**
 * @typedef {object} DateEditorParams
 * @property {string} [min] Minimum selectable date string.
 * @property {string} [max] Maximum selectable date string.
 * @property {string} [format] Luxon format string for parsing/formatting the date value (default 'yyyy-MM-dd').
 * @property {object} [elementAttributes] HTML attributes to set on the date input element.
 * @property {"hybrid"|"editor"|"table"} [verticalNavigation] How up/down arrow keys navigate.
 */

/**
 * @typedef {object} TimeEditorParams
 * @property {string} [min] Minimum selectable time string.
 * @property {string} [max] Maximum selectable time string.
 * @property {string} [format] Luxon format string for the time value (default 'HH:mm').
 * @property {object} [elementAttributes] HTML attributes to set on the time input element.
 * @property {"hybrid"|"editor"|"table"} [verticalNavigation] How up/down arrow keys navigate.
 */

/**
 * @typedef {object} DatetimeEditorParams
 * @property {string} [min] Minimum selectable datetime string.
 * @property {string} [max] Maximum selectable datetime string.
 * @property {string} [format] Luxon format string for the datetime value (default 'yyyy-MM-dd HH:mm:ss').
 * @property {object} [elementAttributes] HTML attributes to set on the datetime input element.
 * @property {"hybrid"|"editor"|"table"} [verticalNavigation] How up/down arrow keys navigate.
 */

/**
 * @typedef {InputEditorParams|TextareaEditorParams|NumberEditorParams|RangeEditorParams|TickCrossEditorParams|StarEditorParams|ListEditorParams|DateEditorParams|TimeEditorParams|DatetimeEditorParams|object} EditorParams
 */

/**
 * @typedef {object} ColumnDefinition
 *
 * --- General ---
 * @property {string} [title] Required. Title displayed in the column header.
 * @property {string} [field] Required (except icon/button columns). Data field key this column maps to.
 * @property {ColumnDefinition[]} [columns] Sub-columns for column grouping.
 * @property {boolean} [visible] Whether the column is visible. Defaults to true.
 *
 * --- Layout ---
 * @property {"left"|"center"|"right"} [hozAlign] Horizontal text alignment for cells.
 * @property {"top"|"middle"|"bottom"} [vertAlign] Vertical text alignment for cells.
 * @property {"left"|"center"|"right"} [headerHozAlign] Horizontal alignment of the column header title.
 * @property {string|number} [width] Column width in pixels or as a percentage of total table width.
 * @property {number} [minWidth] Minimum column width in pixels. Defaults to 40.
 * @property {number} [maxWidth] Maximum column width in pixels.
 * @property {number} [maxInitialWidth] Maximum width on first render; user can resize above this (up to maxWidth).
 * @property {number} [widthGrow] In fitColumns layout, the relative amount this column should grow to fill space.
 * @property {number} [widthShrink] In fitColumns layout, the relative amount this column should shrink to fit space.
 * @property {boolean} [resizable] Allow the user to resize this column by dragging its edges. Defaults to true.
 * @property {boolean|"top"|"bottom"} [frozen] Freeze the column in place while scrolling horizontally.
 * @property {number} [responsive] Priority for hiding this column in responsive layout mode (lower = hidden first).
 * @property {boolean|string|Function} [tooltip] Tooltip shown on hover over cells in this column.
 * @property {string} [cssClass] Space-separated CSS class names to add to the column header and all cells.
 * @property {boolean} [rowHandle] Designate this column as the drag handle for movable rows.
 * @property {boolean} [htmlOutput] Include or exclude this column from getHtml output.
 * @property {string} [titleHtmlOutput] Custom title for this column in getHtml output.
 * @property {boolean} [print] Include or exclude this column from the print output.
 * @property {string} [titlePrint] Custom title for this column in print output.
 * @property {boolean} [download] Include or exclude this column from downloaded data.
 * @property {string} [titleDownload] Custom title for this column in downloads.
 * @property {boolean} [clipboard] Include or exclude this column from clipboard copy output.
 * @property {string} [titleClipboard] Custom title for this column in clipboard output.
 * @property {boolean} [variableHeight] Stretch the row height to fit this cell's content instead of hiding overflow.
 *
 * --- Data Manipulation ---
 * @property {Sorter} [sorter] Sorter used to sort this column's data.
 * @property {SorterParams|Function} [sorterParams] Additional parameters passed to the sorter.
 * @property {Formatter} [formatter] Formatter used to render cell content.
 * @property {FormatterParams|Function} [formatterParams] Additional parameters passed to the formatter.
 * @property {Formatter} [formatterPrint] Formatter used when the table is printed.
 * @property {FormatterParams|Function} [formatterPrintParams] Additional parameters passed to formatterPrint.
 * @property {Formatter} [formatterClipboard] Formatter used when cells are copied to the clipboard.
 * @property {FormatterParams|Function} [formatterClipboardParams] Additional parameters passed to formatterClipboard.
 * @property {Formatter} [formatterHtmlOutput] Formatter used when getHtml is called.
 * @property {FormatterParams|Function} [formatterHtmlOutputParams] Additional parameters passed to formatterHtmlOutput.
 * @property {boolean} [variableHeight] Expand row height to fit cell contents instead of clipping overflow.
 * @property {boolean|Function} [editable] Whether the cell is editable; pass a function for dynamic control.
 * @property {Editor} [editor] Editor used when the user edits this cell.
 * @property {EditorParams|Function} [editorParams] Additional parameters passed to the editor.
 * @property {any} [editorEmptyValue] Value assigned to the cell when the editor is cleared.
 * @property {Function} [editorEmptyValueFunc] Function that determines whether an edited value is considered empty.
 * @property {Validator|Validator[]} [validator] Validator(s) used to validate the cell value after editing.
 * @property {any[]|boolean} [contextMenu] Context-menu items shown when right-clicking a cell.
 * @property {any[]|boolean} [clickMenu] Menu items shown when left-clicking a cell.
 * @property {any[]|boolean} [dblClickMenu] Menu items shown when double-clicking a cell.
 * @property {string|HTMLElement|boolean} [contextPopup] Popup content shown when right-clicking a cell.
 * @property {string|HTMLElement|boolean} [clickPopup] Popup content shown when left-clicking a cell.
 * @property {string|HTMLElement|boolean} [dblClickPopup] Popup content shown when double-clicking a cell.
 * @property {Mutator} [mutator] Function to manipulate column values as data is parsed into the table.
 * @property {object|Function} [mutatorParams] Additional parameters passed to mutator.
 * @property {Mutator} [mutatorData] Mutator applied when data is loaded via setData / data option.
 * @property {object|Function} [mutatorDataParams] Additional parameters passed to mutatorData.
 * @property {Mutator} [mutatorEdit] Mutator applied when a user edits a cell.
 * @property {object|Function} [mutatorEditParams] Additional parameters passed to mutatorEdit.
 * @property {Mutator} [mutatorClipboard] Mutator applied when data is pasted from the clipboard.
 * @property {object|Function} [mutatorClipboardParams] Additional parameters passed to mutatorClipboard.
 * @property {Mutator} [mutatorImport] Mutator applied when data is imported from a file.
 * @property {object|Function} [mutatorImportParams] Additional parameters passed to mutatorImport.
 * @property {string|string[]} [mutateLink] Field name(s) of columns that should be re-mutated when this column is edited.
 * @property {Accessor} [accessor] Function to transform cell values before they are extracted from the table.
 * @property {object|Function} [accessorParams] Additional parameters passed to accessor.
 * @property {Accessor} [accessorData] Accessor applied when getData is called.
 * @property {object|Function} [accessorDataParams] Additional parameters passed to accessorData.
 * @property {Accessor} [accessorDownload] Accessor applied when the table is downloaded.
 * @property {object|Function} [accessorDownloadParams] Additional parameters passed to accessorDownload.
 * @property {Accessor} [accessorClipboard] Accessor applied when the table is copied to the clipboard.
 * @property {object|Function} [accessorClipboardParams] Additional parameters passed to accessorClipboard.
 * @property {Accessor} [accessorPrint] Accessor applied when the table is printed.
 * @property {object|Function} [accessorPrintParams] Additional parameters passed to accessorPrint.
 * @property {Accessor} [accessorHtmlOutput] Accessor applied when getHtml is called.
 * @property {object|Function} [accessorHtmlOutputParams] Additional parameters passed to accessorHtmlOutput.
 *
 * --- Column Calculations ---
 * @property {ColumnCalc} [topCalc] Calculation displayed at the top of this column.
 * @property {ColumnCalcParams|Function} [topCalcParams] Additional parameters passed to topCalc.
 * @property {Formatter} [topCalcFormatter] Formatter for the topCalc calculation cell.
 * @property {FormatterParams|Function} [topCalcFormatterParams] Additional parameters passed to topCalcFormatter.
 * @property {ColumnCalc} [bottomCalc] Calculation displayed at the bottom of this column.
 * @property {ColumnCalcParams|Function} [bottomCalcParams] Additional parameters passed to bottomCalc.
 * @property {Formatter} [bottomCalcFormatter] Formatter for the bottomCalc calculation cell.
 * @property {FormatterParams|Function} [bottomCalcFormatterParams] Additional parameters passed to bottomCalcFormatter.
 *
 * --- Cell Events ---
 * @property {Function} [cellClick] Callback fired when the user clicks a cell in this column.
 * @property {Function} [cellDblClick] Callback fired when the user double-clicks a cell in this column.
 * @property {Function} [cellContext] Callback fired when the user right-clicks a cell in this column.
 * @property {Function} [cellTap] Callback fired when the user taps a cell (touch displays).
 * @property {Function} [cellDblTap] Callback fired when the user double-taps a cell within 300 ms (touch displays).
 * @property {Function} [cellTapHold] Callback fired when the user taps and holds a cell for 1 second (touch displays).
 * @property {Function} [cellMouseEnter] Callback fired when the mouse pointer enters a cell.
 * @property {Function} [cellMouseLeave] Callback fired when the mouse pointer leaves a cell.
 * @property {Function} [cellMouseOver] Callback fired when the mouse pointer enters a cell or any of its child elements.
 * @property {Function} [cellMouseOut] Callback fired when the mouse pointer leaves a cell or any of its child elements.
 * @property {Function} [cellMouseMove] Callback fired when the mouse pointer moves over a cell.
 * @property {Function} [cellMouseDown] Callback fired when the left mouse button is pressed over a cell.
 * @property {Function} [cellMouseUp] Callback fired when the left mouse button is released over a cell.
 * @property {Function} [cellEditing] Callback fired when a cell in this column enters edit mode.
 * @property {Function} [cellEdited] Callback fired when a cell in this column has been edited by the user.
 * @property {Function} [cellEditCancelled] Callback fired when an edit on a cell in this column is cancelled.
 *
 * --- Column Headers ---
 * @property {boolean} [headerSort] Allow sorting by clicking the column header. Defaults to true.
 * @property {"asc"|"desc"} [headerSortStartingDir] Initial sort direction when the header is first clicked.
 * @property {boolean} [headerSortTristate] Enable a third "unsorted" state when cycling through sort directions.
 * @property {Function} [headerClick] Callback fired when the user clicks the column header.
 * @property {Function} [headerDblClick] Callback fired when the user double-clicks the column header.
 * @property {Function} [headerContext] Callback fired when the user right-clicks the column header.
 * @property {Function} [headerTap] Callback fired when the user taps the column header (touch displays).
 * @property {Function} [headerDblTap] Callback fired when the user double-taps the column header within 300 ms (touch displays).
 * @property {Function} [headerTapHold] Callback fired when the user taps and holds the column header for 1 second (touch displays).
 * @property {Function} [headerMouseEnter] Callback fired when the mouse pointer enters the column header.
 * @property {Function} [headerMouseLeave] Callback fired when the mouse pointer leaves the column header.
 * @property {Function} [headerMouseOver] Callback fired when the mouse pointer enters the column header or a child element.
 * @property {Function} [headerMouseOut] Callback fired when the mouse pointer leaves the column header or a child element.
 * @property {Function} [headerMouseMove] Callback fired when the mouse pointer moves over the column header.
 * @property {Function} [headerMouseDown] Callback fired when the left mouse button is pressed over the column header.
 * @property {Function} [headerMouseUp] Callback fired when the left mouse button is released over the column header.
 * @property {boolean|string|Function} [headerTooltip] Tooltip shown on hover over the column header.
 * @property {boolean|"flip"} [headerVertical] Rotate the column header text to a vertical orientation; "flip" rotates 180°.
 * @property {boolean} [editableTitle] Allow the user to edit the column header title inline.
 * @property {Formatter} [titleFormatter] Formatter function used to render the column header title.
 * @property {FormatterParams|Function} [titleFormatterParams] Additional parameters passed to titleFormatter.
 * @property {boolean} [headerWordWrap] Wrap overflowing header title text instead of truncating with an ellipsis.
 * @property {boolean|string|Function} [headerFilter] Enable a filter input in the column header.
 * @property {string} [headerFilterPlaceholder] Placeholder text for the header filter input.
 * @property {EditorParams|Function} [headerFilterParams] Additional parameters passed to the header filter (uses same params as the matching editor).
 * @property {Function} [headerFilterEmptyCheck] Function that determines when the header filter value is considered empty.
 * @property {string|Function} [headerFilterFunc] Custom filter function used by the header filter.
 * @property {object} [headerFilterFuncParams] Additional parameters passed to headerFilterFunc.
 * @property {boolean} [headerFilterLiveFilter] Apply the header filter as the user types. Defaults to true.
 * @property {any[]|Function|boolean} [headerMenu] Menu button items added to the column header.
 * @property {string|HTMLElement} [headerMenuIcon] Custom icon element for the header menu button.
 * @property {any[]|Function|boolean} [headerClickMenu] Menu items shown when left-clicking the column header.
 * @property {any[]|Function|boolean} [headerDblClickMenu] Menu items shown when double-clicking the column header.
 * @property {any[]|Function|boolean} [headerContextMenu] Context-menu items shown when right-clicking the column header.
 * @property {string|HTMLElement|boolean} [headerPopup] Popup button content added to the column header.
 * @property {string|HTMLElement} [headerPopupIcon] Custom icon element for the header popup button.
 * @property {string|HTMLElement|boolean} [headerClickPopup] Popup content shown when left-clicking the column header.
 * @property {string|HTMLElement|boolean} [headerDblClickPopup] Popup content shown when double-clicking the column header.
 * @property {string|HTMLElement|boolean} [headerContextPopup] Popup content shown when right-clicking the column header.
 */

export default class ColumnComponent {
  /**
   * @param {object} column Internal Column instance.
   */
  constructor(column) {
    this._column = column
    this.type = 'ColumnComponent'

    return new Proxy(this, {
      get(target, name, receiver) {
        if (typeof name === 'symbol') {
          return Reflect.get(target, name, receiver)
        }

        if (target[name] !== undefined) {
          return target[name]
        }

        return target._column.table.componentFunctionBinder.handle('column', target._column, name)
      }
    })
  }

  /**
   * Get the column header element.
   * @returns {HTMLElement|null}
   */
  getElement() {
    return this._column.getElement()
  }

  /**
   * Get the column definition object.
   * @returns {ColumnDefinition}
   */
  getDefinition() {
    return this._column.getDefinition()
  }

  /**
   * Get the column field.
   * @returns {string}
   */
  getField() {
    return this._column.getField()
  }

  /**
   * Get the download title for the column.
   * @returns {string|null}
   */
  getTitleDownload() {
    return this._column.getTitleDownload()
  }

  /**
   * Get cell components belonging to this column.
   * @returns {CellComponent[]}
   */
  getCells() {
    return this._column.cells.map((cell) => cell.getComponent())
  }

  /**
   * Check whether the column is visible.
   * @returns {boolean}
   */
  isVisible() {
    return this._column.visible
  }

  /**
   * Show this column (or all child columns for groups).
   */
  show() {
    if (this._column.isGroup) {
      this._column.columns.forEach((column) => {
        column.show()
      })
    } else {
      this._column.show()
    }
  }

  /**
   * Hide this column (or all child columns for groups).
   */
  hide() {
    if (this._column.isGroup) {
      this._column.columns.forEach((column) => {
        column.hide()
      })
    } else {
      this._column.hide()
    }
  }

  /**
   * Toggle column visibility.
   */
  toggle() {
    this._column.visible ? this.hide() : this.show()
  }

  /**
   * Delete this column.
   * @returns {Promise<void>}
   */
  delete() {
    return this._column.delete()
  }

  /**
   * Get direct child column components.
   * @returns {Array<ColumnComponent>}
   */
  getSubColumns() {
    return this._column.columns.map((column) => column.getComponent())
  }

  /**
   * Get parent column component if this column is grouped.
   * @returns {ColumnComponent|false}
   */
  getParentColumn() {
    return this._column.getParentComponent()
  }

  /**
   * Get internal column instance.
   * @returns {object}
   */
  _getSelf() {
    return this._column
  }

  /**
   * Scroll this column into view.
   * @param {"left" | "center" | "middle" | "right"} [position] Scroll alignment position.
   * @param {boolean} [ifVisible] Skip scroll when the column is already visible.
   * @returns {Promise<void>}
   */
  scrollTo(position, ifVisible) {
    return this._column.table.columnManager.scrollToColumn(this._column, position, ifVisible)
  }

  /**
   * Get parent table instance.
   * @returns {Tabulator}
   */
  getTable() {
    return this._column.table
  }

  /**
   * Move this column relative to another column.
   * @param {ColumnComponent|HTMLElement|string} to Target column lookup.
   * @param {boolean} [after] Insert after target when true.
   */
  move(to, after) {
    const toColumn = this._column.table.columnManager.findColumn(to)

    if (toColumn) {
      this._column.table.columnManager.moveColumn(this._column, toColumn, after)
    } else {
      console.warn('Move Error - No matching column found:', to)
    }
  }

  /**
   * Get next visible column component.
   * @returns {ColumnComponent|false}
   */
  getNextColumn() {
    const nextCol = this._column.nextColumn()

    return nextCol ? nextCol.getComponent() : false
  }

  /**
   * Get previous visible column component.
   * @returns {ColumnComponent|false}
   */
  getPrevColumn() {
    const prevCol = this._column.prevColumn()

    return prevCol ? prevCol.getComponent() : false
  }

  /**
   * Update this column definition.
   * @param {ColumnDefinition} updates Partial definition updates.
   * @returns {Promise<ColumnComponent>}
   */
  updateDefinition(updates) {
    return this._column.updateDefinition(updates)
  }

  /**
   * Get the computed column width.
   * @returns {number}
   */
  getWidth() {
    return this._column.getWidth()
  }

  /**
   * Set column width or reset to fit-content width.
   * @param {number|string|boolean} width Pixel/percent width, or true to refit width.
   */
  setWidth(width) {
    const result = width === true ? this._column.reinitializeWidth(true) : this._column.setWidth(width)

    this._column.table.columnManager.rerenderColumns(true)

    return result
  }

  _callBinder(name, ...args) {
    const handler = this._column.table.componentFunctionBinder.handle('column', this._column, name)
    if (handler) {
      return handler(...args)
    }
    throw new Error(`Module providing column component function '${name}' is not installed.`)
  }

  /**
   * Focus the header filter element for this column.
   */
  headerFilterFocus() {
    this._callBinder('headerFilterFocus')
  }

  /**
   * Rebuild the header filter element.
   */
  reloadHeaderFilter() {
    this._callBinder('reloadHeaderFilter')
  }

  /**
   * Get the current header filter value of a column.
   * @returns {*}
   */
  getHeaderFilterValue() {
    return this._callBinder('getHeaderFilterValue')
  }

  /**
   * Set the value of the columns header filter element.
   * @param {*} value Header filter value.
   */
  setHeaderFilterValue(value) {
    this._callBinder('setHeaderFilterValue', value)
  }

  /**
   * Get all ranges that overlap this column.
   * @returns {RangeComponent[]} Array of Range Components.
   */
  getRanges() {
    return this._callBinder('getRanges')
  }

  /**
   * Open popup menu.
   * @param {string} contents Popup content.
   * @param {"click" | "right" | "bottom" | "left" | "top" | "center"} [position] Popup position.
   */
  popup(contents, position) {
    this._callBinder('popup', contents, position)
  }

  /**
   * Validate this column.
   * @returns {boolean|CellComponent[]} True if passes validation, or array of failed cell components.
   */
  validate() {
    return this._callBinder('validate')
  }
}
