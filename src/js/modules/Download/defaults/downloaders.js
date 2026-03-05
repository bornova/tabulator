import csv from './downloaders/csv'
import json from './downloaders/json'
import pdf from './downloaders/pdf'
import xlsx from './downloaders/xlsx'
import html from './downloaders/html'
import jsonLines from './downloaders/jsonLines'

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
