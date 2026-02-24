import csv from './downloaders/csv.js'
import json from './downloaders/json.js'
import pdf from './downloaders/pdf.js'
import xlsx from './downloaders/xlsx.js'
import html from './downloaders/html.js'
import jsonLines from './downloaders/jsonLines.js'

/**
 * Default downloader implementations.
 *
 * @type {{
 *   csv: function(Object, Array<Object>, Object): void,
 *   json: function(Object, Array<Object>, Object): void,
 *   jsonLines: function(Object, Array<Object>, Object): void,
 *   pdf: function(Object, Array<Object>, Object): void,
 *   xlsx: function(Object, Array<Object>, Object): void,
 *   html: function(Object, Array<Object>, Object): void
 * }}
 */
const defaultDownloaders = {
  csv,
  json,
  jsonLines,
  pdf,
  xlsx,
  html
}

export default defaultDownloaders
