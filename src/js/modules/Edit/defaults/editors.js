import input from './editors/input'
import textarea from './editors/textarea'
import number from './editors/number'
import range from './editors/range'
import date from './editors/date'
import time from './editors/time'
import datetime from './editors/datetime'
import list from './editors/list'
import star from './editors/star'
import progress from './editors/progress'
import tickCross from './editors/tickCross'
import adaptable from './editors/adaptable'

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
const defaultEditors = {
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

export default defaultEditors
