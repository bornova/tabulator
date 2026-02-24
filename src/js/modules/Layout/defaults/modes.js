import fitData from './modes/fitData.js'
import fitDataGeneral from './modes/fitDataGeneral.js'
import fitDataStretch from './modes/fitDataStretch.js'
import fitColumns from './modes/fitColumns.js'

/**
 * Default layout mode handlers.
 *
 * @type {{
 *   fitData: function(Array<Object>, boolean=): void,
 *   fitDataFill: function(Array<Object>, boolean=): void,
 *   fitDataTable: function(Array<Object>, boolean=): void,
 *   fitDataStretch: function(Array<Object>, boolean=): void,
 *   fitColumns: function(Array<Object>, boolean=): void
 * }}
 */
export default {
  fitData,
  fitDataFill: fitDataGeneral,
  fitDataTable: fitDataGeneral,
  fitDataStretch,
  fitColumns
}
