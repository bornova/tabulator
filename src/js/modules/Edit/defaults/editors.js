import input from './editors/input.js'
import textarea from './editors/textarea.js'
import number from './editors/number.js'
import range from './editors/range.js'
import date from './editors/date.js'
import time from './editors/time.js'
import datetime from './editors/datetime.js'
import list from './editors/list.js'
import star from './editors/star.js'
import progress from './editors/progress.js'
import tickCross from './editors/tickCross.js'
import adaptable from './editors/adaptable.js'

/**
 * Default editor implementations.
 *
 * @type {{
 *   input: function(Object, function, function, function, Object): HTMLElement,
 *   textarea: function(Object, function, function, function, Object): HTMLElement,
 *   number: function(Object, function, function, function, Object): HTMLElement,
 *   range: function(Object, function, function, function, Object): HTMLElement,
 *   date: function(Object, function, function, function, Object): HTMLElement,
 *   time: function(Object, function, function, function, Object): HTMLElement,
 *   datetime: function(Object, function, function, function, Object): HTMLElement,
 *   list: function(Object, function, function, function, Object): HTMLElement,
 *   star: function(Object, function, function, function, Object): HTMLElement,
 *   progress: function(Object, function, function, function, Object): HTMLElement,
 *   tickCross: function(Object, function, function, function, Object): HTMLElement,
 *   adaptable: function(Object, function, function, function, Object): HTMLElement
 * }}
 */
export default {
  input,
  textarea,
  number,
  range,
  date,
  time,
  datetime,
  list,
  star,
  progress,
  tickCross,
  adaptable
}
