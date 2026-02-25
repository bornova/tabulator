// draggable progress bar
/**
 * Draggable progress-bar editor.
 * @param {object} cell Cell component wrapper.
 * @param {Function} onRendered Render callback registrar.
 * @param {Function} success Success callback.
 * @param {Function} cancel Cancel callback.
 * @param {object} editorParams Editor params.
 * @returns {HTMLElement}
 */
export default function (cell, onRendered, success, cancel, editorParams) {
  const element = cell.getElement()
  const firstInnerDiv = element.getElementsByTagName('div')[0]
  const max =
    editorParams.max === undefined ? (firstInnerDiv && firstInnerDiv.getAttribute('max')) || 100 : editorParams.max
  const min =
    editorParams.min === undefined ? (firstInnerDiv && firstInnerDiv.getAttribute('min')) || 0 : editorParams.min
  const percent = (max - min) / 100
  let value = cell.getValue() || 0
  const handle = document.createElement('div')
  const bar = document.createElement('div')
  let mouseDrag
  let mouseDragWidth

  function getEditorInnerWidth() {
    const style = window.getComputedStyle(element, null)
    const paddingLeft = Number.parseInt(style.getPropertyValue('padding-left'), 10) || 0
    const paddingRight = Number.parseInt(style.getPropertyValue('padding-right'), 10) || 0

    return element.clientWidth - paddingLeft - paddingRight
  }

  // set new value
  function updateValue() {
    const editorInnerWidth = getEditorInnerWidth()

    const calcVal = percent * Math.round(bar.offsetWidth / (editorInnerWidth / 100)) + min
    success(calcVal)
    element.setAttribute('aria-valuenow', calcVal)
    element.setAttribute('aria-label', calcVal)
  }

  handle.classList.add('tabulator-progress-handle', 'tabulator-progress-editor-handle')

  // style bar
  bar.classList.add('tabulator-progress-editor-bar')
  // bar.style.top = "8px";
  // bar.style.bottom = "8px";
  // bar.style.left = "4px";
  // bar.style.marginRight = "4px";

  if (editorParams.elementAttributes && typeof editorParams.elementAttributes === 'object') {
    for (let key in editorParams.elementAttributes) {
      if (key.charAt(0) === '+') {
        key = key.slice(1)
        bar.setAttribute(key, bar.getAttribute(key) + editorParams.elementAttributes[`+${key}`])
      } else {
        bar.setAttribute(key, editorParams.elementAttributes[key])
      }
    }
  }

  // style cell
  element.classList.add('tabulator-progress-editor-cell')

  // make sure value is in range
  value = Math.min(parseFloat(value), max)
  value = Math.max(parseFloat(value), min)

  // workout percentage
  value = Math.round((value - min) / percent)
  // bar.style.right = value + "%";
  bar.style.width = `${value}%`

  element.setAttribute('aria-valuemin', min)
  element.setAttribute('aria-valuemax', max)

  bar.appendChild(handle)

  handle.addEventListener('mousedown', (e) => {
    mouseDrag = e.screenX
    mouseDragWidth = bar.offsetWidth
  })

  element.addEventListener('mousemove', (e) => {
    if (mouseDrag) {
      bar.style.width = `${mouseDragWidth + e.screenX - mouseDrag}px`
    }
  })

  element.addEventListener('mouseup', (e) => {
    if (mouseDrag) {
      e.stopPropagation()
      e.stopImmediatePropagation()

      mouseDrag = false
      mouseDragWidth = false

      updateValue()
    }
  })

  // allow key based navigation
  element.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight': // right arrow
        e.preventDefault()
        bar.style.width = `${bar.clientWidth + getEditorInnerWidth() / 100}px`
        break

      case 'ArrowLeft': // left arrow
        e.preventDefault()
        bar.style.width = `${bar.clientWidth - getEditorInnerWidth() / 100}px`
        break

      case 'Tab': // tab
      case 'Enter': // enter
        updateValue()
        break

      case 'Escape': // escape
        cancel()
        break
    }
  })

  element.addEventListener('blur', () => {
    cancel()
  })

  return bar
}
