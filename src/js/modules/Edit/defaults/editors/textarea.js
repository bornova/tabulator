import maskInput from '../../inputMask.js'

// resizable text area element
/**
 * Resizable textarea editor.
 * @param {object} cell Cell component wrapper.
 * @param {Function} onRendered Render callback registrar.
 * @param {Function} success Success callback.
 * @param {Function} cancel Cancel callback.
 * @param {object} editorParams Editor params.
 * @returns {HTMLTextAreaElement}
 */
export default function (cell, onRendered, success, cancel, editorParams) {
  let cellValue = cell.getValue()
  const vertNav = editorParams.verticalNavigation || 'hybrid'
  const value = String(cellValue !== null && cellValue !== undefined ? cellValue : '')
  const input = document.createElement('textarea')
  let scrollHeight = 0

  // create and style input
  input.style.display = 'block'
  input.style.padding = '2px'
  input.style.height = '100%'
  input.style.width = '100%'
  input.style.boxSizing = 'border-box'
  input.style.whiteSpace = 'pre-wrap'
  input.style.resize = 'none'

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

  input.value = value

  onRendered(() => {
    if (cell.getType() === 'cell') {
      input.focus({ preventScroll: true })
      input.style.height = '100%'

      input.scrollHeight
      input.style.height = `${input.scrollHeight}px`
      cell.getRow().normalizeHeight()

      if (editorParams.selectContents) {
        input.select()
      }
    }
  })

  function onChange() {
    if (((cellValue === null || cellValue === undefined) && input.value !== '') || input.value !== cellValue) {
      if (success(input.value)) {
        cellValue = input.value // persist value if successfully validated incase editor is used as header filter
      }

      setTimeout(() => {
        cell.getRow().normalizeHeight()
      }, 300)
    } else {
      cancel()
    }
  }

  // submit new value on blur or change
  input.addEventListener('change', onChange)
  input.addEventListener('blur', onChange)

  input.addEventListener('keyup', () => {
    input.style.height = ''

    const heightNow = input.scrollHeight

    input.style.height = `${heightNow}px`

    if (heightNow !== scrollHeight) {
      scrollHeight = heightNow
      cell.getRow().normalizeHeight()
    }
  })

  input.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Enter':
        if (e.shiftKey && editorParams.shiftEnterSubmit) {
          onChange()
        }
        break

      case 'Escape':
        cancel()
        break

      case 'ArrowUp': // up arrow
        if (vertNav === 'editor' || (vertNav === 'hybrid' && input.selectionStart)) {
          e.stopImmediatePropagation()
          e.stopPropagation()
        }

        break

      case 'ArrowDown': // down arrow
        if (vertNav === 'editor' || (vertNav === 'hybrid' && input.selectionStart !== input.value.length)) {
          e.stopImmediatePropagation()
          e.stopPropagation()
        }
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
