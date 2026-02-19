/**
 * Format datetime values using luxon.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {{inputFormat?: string, outputFormat?: string, invalidPlaceholder?: *|function(*): *, timezone?: string}} formatterParams Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {*} Formatted datetime value.
 */
export default function (cell, formatterParams, onRendered) {
  void onRendered
  const DT = this.table.dependencyRegistry.lookup(['luxon', 'DateTime'], 'DateTime')
  const inputFormat = formatterParams.inputFormat || 'yyyy-MM-dd HH:mm:ss'
  const outputFormat = formatterParams.outputFormat || 'dd/MM/yyyy HH:mm:ss'
  const invalid = typeof formatterParams.invalidPlaceholder !== 'undefined' ? formatterParams.invalidPlaceholder : ''
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
      if (formatterParams.timezone) {
        newDatetime = newDatetime.setZone(formatterParams.timezone)
      }

      return newDatetime.toFormat(outputFormat)
    }

    if (invalid === true || !value) {
      return value
    }

    return typeof invalid === 'function' ? invalid(value) : invalid
  } else {
    console.error("Format Error - 'datetime' formatter is dependant on luxon.js")

    if (invalid === true || !value) {
      return value
    }

    return typeof invalid === 'function' ? invalid(value) : invalid
  }
}
