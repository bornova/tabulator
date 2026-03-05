import number from './sorters/number'
import string from './sorters/string'
import date from './sorters/date'
import time from './sorters/time'
import datetime from './sorters/datetime'
import boolean from './sorters/boolean'
import array from './sorters/array'
import exists from './sorters/exists'
import alphanum from './sorters/alphanum'

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
