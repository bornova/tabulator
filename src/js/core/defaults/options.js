export default {
  addRowPos: 'bottom', // position to insert blank rows, top|bottom
  autoColumns: false, // build columns from data row structure
  autoColumnsDefinitions: false,
  columnDefaults: {}, // store column default props
  columnHeaderVertAlign: 'top', // vertical alignment of column headers
  columns: [], // store for column header info
  data: false, // default starting data
  dataLoader: true,
  dataLoaderError: false,
  dataLoaderErrorTimeout: 3000,
  dataLoaderLoading: false,
  dataReceiveParams: {},
  dataSendParams: {},
  debugDeprecation: true, // allow toggling of deprecation warnings
  debugEventsExternal: false, // flag to console log events
  debugEventsInternal: false, // flag to console log events
  debugInitialization: true, // allow toggling of pre initialization function call warnings
  debugInvalidComponentFuncs: true, // allow toggling of invalid component warnings
  debugInvalidOptions: true, // allow toggling of invalid option warnings
  dependencies: {},
  footerElement: false, // hold footer element
  headerVisible: true, // hide header
  height: false, // height of tabulator
  index: 'id', // field for row index
  maxHeight: false, // maximum height of tabulator
  minHeight: false, // minimum height of tabulator
  nestedFieldSeparator: '.', // separator for nested data
  placeholder: false,
  popupContainer: false,
  renderHorizontal: 'basic',
  renderVertical: 'virtual',
  renderVerticalBuffer: 0, // set virtual DOM buffer size
  rowFormatter: false,
  rowFormatterClipboard: null,
  rowFormatterHtmlOutput: null,
  rowFormatterPrint: null,
  rowHeader: false,
  rowHeight: null,
  scrollToColumnIfVisible: true,
  scrollToColumnPosition: 'left',
  scrollToRowIfVisible: true,
  scrollToRowPosition: 'top',
  textDirection: 'auto'
}
