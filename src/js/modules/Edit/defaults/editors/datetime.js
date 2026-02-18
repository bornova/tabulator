// input element
export default function (cell, onRendered, success, cancel, editorParams) {
  const inputFormat = editorParams.format
  const vertNav = editorParams.verticalNavigation || 'editor'
  const DT = inputFormat ? this.table.dependencyRegistry.lookup(['luxon', 'DateTime'], 'DateTime') : null
  let newDatetime

  // create and style input
  let cellValue = cell.getValue()
  const input = document.createElement('input')

  input.type = 'datetime-local'
  input.style.padding = '4px'
  input.style.width = '100%'
  input.style.boxSizing = 'border-box'

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

      cellValue = `${newDatetime.toFormat('yyyy-MM-dd')}T${newDatetime.toFormat('HH:mm')}`
    } else {
      console.error("Editor Error - 'date' editor 'format' param is dependant on luxon.js")
    }
  }

  input.value = cellValue

  onRendered(() => {
    if (cell.getType() === 'cell') {
      input.focus({ preventScroll: true })
      input.style.height = '100%'

      if (editorParams.selectContents) {
        input.select()
      }
    }
  })

  function onChange() {
    let value = input.value
    let luxDateTime

    if (((cellValue === null || cellValue === undefined) && value !== '') || value !== cellValue) {
      if (value && inputFormat) {
        luxDateTime = DT.fromISO(String(value))

        switch (inputFormat) {
          case true:
            value = luxDateTime
            break

          case 'iso':
            value = luxDateTime.toISO()
            break

          default:
            value = luxDateTime.toFormat(inputFormat)
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
    switch (e.keyCode) {
      // case 9:
      case 13:
        onChange()
        break

      case 27:
        cancel()
        break

      case 35:
      case 36:
        e.stopPropagation()
        break

      case 38: // up arrow
      case 40: // down arrow
        if (vertNav === 'editor') {
          e.stopImmediatePropagation()
          e.stopPropagation()
        }
        break
    }
  })

  return input
}
