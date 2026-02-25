// input element
/**
 * Time editor using native time input with optional Luxon formatting.
 * @param {object} cell Cell component wrapper.
 * @param {Function} onRendered Render callback registrar.
 * @param {Function} success Success callback.
 * @param {Function} cancel Cancel callback.
 * @param {object} editorParams Editor params.
 * @returns {HTMLInputElement}
 */
export default function (cell, onRendered, success, cancel, editorParams) {
  const inputFormat = editorParams.format
  const vertNav = editorParams.verticalNavigation || 'editor'
  const DT = inputFormat ? this.table.dependencyRegistry.lookup(['luxon', 'DateTime'], 'DateTime') : null
  let newDatetime

  // create and style input
  let cellValue = cell.getValue()
  const input = document.createElement('input')

  input.type = 'time'
  input.classList.add('tabulator-editor-input')

  if (editorParams.elementAttributes && typeof editorParams.elementAttributes === 'object') {
    for (let key in editorParams.elementAttributes) {
      if (key.charAt(0) === '+') {
        key = key.slice(1)
        input.setAttribute(key, input.getAttribute(key) + editorParams.elementAttributes[`+${key}`])
      } else {
        input.setAttribute(key, editorParams.elementAttributes[key])
      }
    }
  }

  cellValue = cellValue !== undefined ? cellValue : ''

  if (inputFormat) {
    if (DT) {
      if (DT.isDateTime(cellValue)) {
        newDatetime = cellValue
      } else if (inputFormat === 'iso') {
        newDatetime = DT.fromISO(String(cellValue))
      } else {
        newDatetime = DT.fromFormat(String(cellValue), inputFormat)
      }

      cellValue = newDatetime.toFormat('HH:mm')
    } else {
      console.error("Editor Error - 'time' editor 'format' param is dependant on luxon.js")
    }
  }

  input.value = cellValue

  onRendered(() => {
    if (cell.getType() === 'cell') {
      input.focus({ preventScroll: true })
      input.classList.add('tabulator-editor-full-height')

      if (editorParams.selectContents) {
        input.select()
      }
    }
  })

  function onChange() {
    let value = input.value
    let luxTime

    if ((cellValue == null && value !== '') || value !== cellValue) {
      if (value && inputFormat && DT) {
        luxTime = DT.fromFormat(String(value), 'HH:mm')

        switch (inputFormat) {
          case true:
            value = luxTime
            break

          case 'iso':
            value = luxTime.toISO()
            break

          default:
            value = luxTime.toFormat(inputFormat)
        }
      }

      if (success(value)) {
        cellValue = input.value // persist value if successfully validated incase editor is used as header filter
      }
    } else {
      cancel()
    }
  }

  // submit new value on blur
  input.addEventListener('blur', (e) => {
    if (e.relatedTarget || e.rangeParent || e.explicitOriginalTarget !== input) {
      onChange() // only on a "true" blur; not when focusing browser's date/time picker
    }
  })

  // submit new value on enter
  input.addEventListener('keydown', (e) => {
    switch (e.key) {
      // case 9:
      case 'Enter':
        onChange()
        break

      case 'Escape':
        cancel()
        break

      case 'End':
      case 'Home':
        e.stopPropagation()
        break

      case 'ArrowUp': // up arrow
      case 'ArrowDown': // down arrow
        if (vertNav === 'editor') {
          e.stopImmediatePropagation()
          e.stopPropagation()
        }
        break
    }
  })

  return input
}
