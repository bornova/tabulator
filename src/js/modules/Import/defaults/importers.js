import csv from './importers/csv.js'
import json from './importers/json.js'
import array from './importers/array.js'
import xlsx from './importers/xlsx.js'

/**
 * Default importer implementations.
 *
 * @type {{
 *   csv: function(string): Array<Array<string>>,
 *   json: function(string): Array<Object>|Promise<never>,
 *   array: function(Array<Object>): Array<Object>,
 *   xlsx: function(*): Array<Array<*>>
 * }}
 */
export default {
  csv,
  json,
  array,
  xlsx
}
