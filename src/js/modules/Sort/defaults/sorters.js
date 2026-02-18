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
 *   number: function(*, *, Object, Object, Object, string, Object): number,
 *   string: function(*, *, Object, Object, Object, string, Object): number,
 *   date: function(*, *, Object, Object, Object, string, Object): number,
 *   time: function(*, *, Object, Object, Object, string, Object): number,
 *   datetime: function(*, *, Object, Object, Object, string, Object): number,
 *   boolean: function(*, *, Object, Object, Object, string, Object): number,
 *   array: function(*, *, Object, Object, Object, string, Object): number,
 *   exists: function(*, *, Object, Object, Object, string, Object): number,
 *   alphanum: function(*, *, Object, Object, Object, string, Object): number
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
