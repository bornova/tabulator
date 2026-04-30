/**
 * Render an image element from the cell value.
 *
 * @param {Object} cell Cell component.
 * @param {{urlPrefix?: string, urlSuffix?: string, height?: string|number, width?: string|number}} formatterParams Formatter parameters.
 * @returns {HTMLImageElement} Image element.
 */
export default function (cell, formatterParams) {
  formatterParams ??= {}

  const el = document.createElement('img')
  const cellValue = cell.getValue()

  let src = cellValue

  if (formatterParams.urlPrefix) {
    src = `${formatterParams.urlPrefix}${cellValue}`
  }

  if (formatterParams.urlSuffix) {
    src = `${src}${formatterParams.urlSuffix}`
  }

  el.setAttribute('src', src)

  switch (typeof formatterParams.height) {
    case 'number':
      el.style.height = `${formatterParams.height}px`
      break

    case 'string':
      el.style.height = formatterParams.height
      break
  }

  switch (typeof formatterParams.width) {
    case 'number':
      el.style.width = `${formatterParams.width}px`
      break

    case 'string':
      el.style.width = formatterParams.width
      break
  }

  el.addEventListener('load', () => cell.getRow().normalizeHeight())

  return el
}
