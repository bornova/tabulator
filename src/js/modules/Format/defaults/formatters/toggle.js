/**
 * Render a toggle switch display.
 *
 * @param {Object} cell Cell component.
 * @param {Object} formatterParams Formatter parameters.
 * @returns {HTMLDivElement} Toggle element.
 */
export default function (cell, formatterParams) {
  formatterParams ??= {}

  const value = cell.getValue()
  const size = formatterParams.size || 15
  const sizePx = `${size}px`
  const onValue = Object.prototype.hasOwnProperty.call(formatterParams, 'onValue') ? formatterParams.onValue : true
  const offValue = Object.prototype.hasOwnProperty.call(formatterParams, 'offValue') ? formatterParams.offValue : false
  const state = formatterParams.onTruthy ? value : value === onValue

  const containEl = document.createElement('div')
  containEl.classList.add('tabulator-toggle')

  if (state) {
    containEl.classList.add('tabulator-toggle-on')
    containEl.classList.add('tabulator-toggle-on-reverse')

    if (formatterParams.onColor) {
      containEl.style.background = formatterParams.onColor
    }
  } else {
    if (formatterParams.offColor) {
      containEl.style.background = formatterParams.offColor
    }
  }

  containEl.style.width = `${2.5 * size}px`
  containEl.style.borderRadius = sizePx

  if (formatterParams.clickable) {
    containEl.addEventListener('click', () => {
      cell.setValue(state ? offValue : onValue)
    })
  }

  const switchEl = document.createElement('div')
  switchEl.classList.add('tabulator-toggle-switch')

  switchEl.style.height = sizePx
  switchEl.style.width = sizePx
  switchEl.style.borderRadius = sizePx

  containEl.appendChild(switchEl)

  return containEl
}
