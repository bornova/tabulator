// input element
/**
 * Date editor using native date input with optional Luxon formatting.
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
  const input = document.createElement('input')

  let cellValue = cell.getValue()

  function convertDate(value) {
    let newDatetime

    if (DT.isDateTime(value)) {
      newDatetime = value
    } else if (inputFormat === 'iso') {
      newDatetime = DT.fromISO(String(value))
    } else {
      newDatetime = DT.fromFormat(String(value), inputFormat)
    }

    return newDatetime.toFormat('yyyy-MM-dd')
  }

  input.type = 'date'
  input.classList.add('tabulator-editor-input')
  input.setAttribute('name', 'tabulator-editor-input')

  if (editorParams.max) {
    input.setAttribute('max', inputFormat && DT ? convertDate(editorParams.max) : editorParams.max)
  }

  if (editorParams.min) {
    input.setAttribute('min', inputFormat && DT ? convertDate(editorParams.min) : editorParams.min)
  }

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
      cellValue = convertDate(cellValue)
    } else {
      console.error("Editor Error - 'date' editor 'format' param is dependant on luxon.js")
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
    let luxDate

    if ((cellValue == null && value !== '') || value !== cellValue) {
      if (value && inputFormat && DT) {
        luxDate = DT.fromFormat(String(value), 'yyyy-MM-dd')

        switch (inputFormat) {
          case true:
            value = luxDate
            break

          case 'iso':
            value = luxDate.toISO()
            break

          default:
            value = luxDate.toFormat(inputFormat)
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
