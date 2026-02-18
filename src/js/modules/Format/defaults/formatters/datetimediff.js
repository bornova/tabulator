export default function (cell, formatterParams, onRendered) {
  const DT = this.table.dependencyRegistry.lookup(['luxon', 'DateTime'], 'DateTime')
  const inputFormat = formatterParams.inputFormat || 'yyyy-MM-dd HH:mm:ss'
  const invalid = typeof formatterParams.invalidPlaceholder !== 'undefined' ? formatterParams.invalidPlaceholder : ''
  const suffix = typeof formatterParams.suffix !== 'undefined' ? formatterParams.suffix : false
  const unit = typeof formatterParams.unit !== 'undefined' ? formatterParams.unit : 'days'
  const humanize = typeof formatterParams.humanize !== 'undefined' ? formatterParams.humanize : false
  const date = typeof formatterParams.date !== 'undefined' ? formatterParams.date : DT ? DT.now() : null
  const value = cell.getValue()

  if (typeof DT !== 'undefined') {
    let newDatetime

    if (DT.isDateTime(value)) {
      newDatetime = value
    } else if (inputFormat === 'iso') {
      newDatetime = DT.fromISO(String(value))
    } else {
      newDatetime = DT.fromFormat(String(value), inputFormat)
    }

    if (newDatetime.isValid) {
      if (humanize) {
        return `${newDatetime.diff(date, unit).toHuman()}${suffix ? ` ${suffix}` : ''}`
      }

      return `${parseInt(newDatetime.diff(date, unit)[unit])}${suffix ? ` ${suffix}` : ''}`
    }

    if (invalid === true) {
      return value
    }

    return typeof invalid === 'function' ? invalid(value) : invalid
  } else {
    console.error("Format Error - 'datetimediff' formatter is dependant on luxon.js")

    if (invalid === true || !value) {
      return value
    }

    return typeof invalid === 'function' ? invalid(value) : invalid
  }
}
