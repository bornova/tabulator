import plaintext from './formatters/plaintext'
import html from './formatters/html'
import textarea from './formatters/textarea'
import money from './formatters/money'
import link from './formatters/link'
import image from './formatters/image'
import tickCross from './formatters/tickCross'
import datetime from './formatters/datetime'
import datetimediff from './formatters/datetimediff'
import lookup from './formatters/lookup'
import star from './formatters/star'
import traffic from './formatters/traffic'
import progress from './formatters/progress'
import color from './formatters/color'
import buttonTick from './formatters/buttonTick'
import buttonCross from './formatters/buttonCross'
import toggle from './formatters/toggle'
import rownum from './formatters/rownum'
import handle from './formatters/handle'
import adaptable from './formatters/adaptable'
import array from './formatters/array'
import json from './formatters/json'

/**
 * Default formatter implementations.
 *
 * @type {Object<string, function(Object, Object, function): *>}
 */
const defaultFormatters = {
  plaintext,
  html,
  textarea,
  money,
  link,
  image,
  tickCross,
  datetime,
  datetimediff,
  lookup,
  star,
  traffic,
  progress,
  color,
  buttonTick,
  buttonCross,
  toggle,
  rownum,
  handle,
  adaptable,
  array,
  json
}

export default defaultFormatters
