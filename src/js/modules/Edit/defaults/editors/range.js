// input element with type of number
/**
 * Range slider editor.
 * @param {object} cell Cell component wrapper.
 * @param {Function} onRendered Render callback registrar.
 * @param {Function} success Success callback.
 * @param {Function} cancel Cancel callback.
 * @param {object} editorParams Editor params.
 * @returns {HTMLInputElement}
 */
export default function (cell, onRendered, success, cancel, editorParams) {
  let cellValue = cell.getValue()
  const input = document.createElement('input')

  input.setAttribute('type', 'range')

  if (editorParams.max !== undefined) {
    input.setAttribute('max', editorParams.max)
  }

  if (editorParams.min !== undefined) {
    input.setAttribute('min', editorParams.min)
  }

  if (editorParams.step !== undefined) {
    input.setAttribute('step', editorParams.step)
  }

  // create and style input
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

  input.value = cellValue

  onRendered(() => {
    if (cell.getType() === 'cell') {
      input.focus({ preventScroll: true })
      input.classList.add('tabulator-editor-full-height')
    }
  })

  function onChange() {
    let value = input.value

    if (!Number.isNaN(Number(value)) && value !== '') {
      value = Number(value)
    }

    if (value !== cellValue) {
      if (success(value)) {
        cellValue = value // persist value if successfully validated incase editor is used as header filter
      }
    } else {
      cancel()
    }
  }

  // submit new value on blur
  input.addEventListener('blur', () => {
    onChange()
  })

  // submit new value on enter
  input.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Enter':
        // case 9:
        onChange()
        break

      case 'Escape':
        cancel()
        break
    }
  })

  return input
}
