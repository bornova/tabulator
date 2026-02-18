/**
 * Dynamically choose a formatter based on cell value and parameters.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {Object} params Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {*} Formatter result.
 */
export default function (cell, params, onRendered) {
  const defaultLookup = (cell) => {
    const value = cell.getValue()
    let formatter = 'plaintext'

    switch (typeof value) {
      case 'boolean':
        formatter = 'tickCross'
        break

      case 'string':
        if (value.includes('\n')) {
          formatter = 'textarea'
        }
        break
    }

    return formatter
  }

  const lookup = params.formatterLookup ? params.formatterLookup(cell) : defaultLookup(cell)
  const formatterFunc = this.table.modules.format.lookupFormatter(lookup)
  const formatterParams = params.paramsLookup
    ? typeof params.paramsLookup === 'function'
      ? params.paramsLookup(lookup, cell)
      : params.paramsLookup[lookup]
    : undefined

  return formatterFunc.call(this, cell, formatterParams ?? {}, onRendered)
}
