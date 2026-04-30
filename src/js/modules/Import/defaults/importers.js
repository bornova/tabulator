import csv from './importers/csv'
import json from './importers/json'
import array from './importers/array'
import xlsx from './importers/xlsx'

/**
 * Default importer implementations.
 *
 * @type {{
 *   csv: function(string): Array<Array<string>>,
 *   json: function(string): *|Promise<never>,
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
