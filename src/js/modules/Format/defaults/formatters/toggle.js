export default function (cell, formatterParams, onRendered) {
	const value = cell.getValue()
	const size = formatterParams.size || 15
	const sizePx = size + 'px'
	let containEl
	let switchEl
	const onValue = formatterParams.hasOwnProperty('onValue') ? formatterParams.onValue : true
	const offValue = formatterParams.hasOwnProperty('offValue') ? formatterParams.offValue : false
	const state = formatterParams.onTruthy ? value : value === onValue

	containEl = document.createElement('div')
	containEl.classList.add('tabulator-toggle')

	if (state) {
		containEl.classList.add('tabulator-toggle-on')
		containEl.style.flexDirection = 'row-reverse'

		if (formatterParams.onColor) {
			containEl.style.background = formatterParams.onColor
		}
	} else {
		if (formatterParams.offColor) {
			containEl.style.background = formatterParams.offColor
		}
	}

	containEl.style.width = 2.5 * size + 'px'
	containEl.style.borderRadius = sizePx

	if (formatterParams.clickable) {
		containEl.addEventListener('click', (e) => {
			cell.setValue(state ? offValue : onValue)
		})
	}

	switchEl = document.createElement('div')
	switchEl.classList.add('tabulator-toggle-switch')

	switchEl.style.height = sizePx
	switchEl.style.width = sizePx
	switchEl.style.borderRadius = sizePx

	containEl.appendChild(switchEl)

	return containEl
}
