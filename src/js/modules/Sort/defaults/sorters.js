import number from './sorters/number.js'
import string from './sorters/string.js'
import date from './sorters/date.js'
import time from './sorters/time.js'
import datetime from './sorters/datetime.js'
import boolean from './sorters/boolean.js'
import array from './sorters/array.js'
import exists from './sorters/exists.js'
import alphanum from './sorters/alphanum.js'

/**
 * Default sorter implementations.
 *
 * @type {{
 *   number: function(*, *, object, object, object, string, object): number,
 *   string: function(*, *, object, object, object, string, object): number,
 *   date: function(*, *, object, object, object, string, object): number,
 *   time: function(*, *, object, object, object, string, object): number,
 *   datetime: function(*, *, object, object, object, string, object): number,
 *   boolean: function(*, *, object, object, object, string, object): number,
 *   array: function(*, *, object, object, object, string, object): number,
 *   exists: function(*, *, object, object, object, string, object): number,
 *   alphanum: function(*, *, object, object, object, string, object): number
 * }}
 */
export default {
  number,
  string,
  date,
  time,
  datetime,
  boolean,
  array,
  exists,
  alphanum
}
