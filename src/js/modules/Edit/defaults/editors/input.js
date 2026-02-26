import maskInput from '../../inputMask.js'

// input element
/**
 * Text/search input editor.
 * @param {object} cell Cell component wrapper.
 * @param {Function} onRendered Render callback registrar.
 * @param {Function} success Success callback.
 * @param {Function} cancel Cancel callback.
 * @param {object} editorParams Editor params.
 * @returns {HTMLInputElement}
 */
export default function (cell, onRendered, success, cancel, editorParams) {
  // create and style input
  const input = document.createElement('input')

  let cellValue = cell.getValue()

  input.setAttribute('type', editorParams.search ? 'search' : 'text')
  input.setAttribute('name', 'tabulator-editor-input')

  input.classList.add('tabulator-editor-input')

  if (editorParams.elementAttributes && typeof editorParams.elementAttributes === 'object') {
    for (let key in editorParams.elementAttributes) {
      if (key.charAt(0) === '+') {
        key = key.slice(1)
        input.setAttribute(key, (input.getAttribute(key) || '') + editorParams.elementAttributes[`+${key}`])
      } else {
        input.setAttribute(key, editorParams.elementAttributes[key])
      }
    }
  }

  input.value = cellValue !== undefined ? cellValue : ''

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
    if ((cellValue == null && input.value !== '') || input.value !== cellValue) {
      if (success(input.value)) {
        cellValue = input.value // persist value if successfully validated incase editor is used as header filter
      }
    } else {
      cancel()
    }
  }

  // submit new value on blur or change
  input.addEventListener('change', onChange)
  input.addEventListener('blur', onChange)

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
    }
  })

  if (editorParams.mask) {
    maskInput(input, editorParams)
  }

  return input
}
