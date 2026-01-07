import Module from '../../core/Module.js'

import defaultBindings from './defaults/bindings.js'
import defaultActions from './defaults/actions.js'

export default class Keybindings extends Module {
	static moduleName = 'keybindings'

	// load defaults
	static bindings = defaultBindings
	static actions = defaultActions

	constructor(table) {
		super(table)

		this.watchKeys = null
		this.pressedKeys = null
		this.keyupBinding = false
		this.keydownBinding = false

		this.registerTableOption('keybindings', {}) // array for keybindings
		this.registerTableOption('tabEndNewRow', false) // create new row when tab to end of table
	}

	initialize() {
		const bindings = this.table.options.keybindings
		const mergedBindings = {}

		this.watchKeys = {}
		this.pressedKeys = []

		if (bindings !== false) {
			Object.assign(mergedBindings, Keybindings.bindings)
			Object.assign(mergedBindings, bindings)

			this.mapBindings(mergedBindings)
			this.bindEvents()
		}

		this.subscribe('table-destroy', this.clearBindings.bind(this))
	}

	mapBindings(bindings) {
		for (const key in bindings) {
			if (Keybindings.actions[key]) {
				if (bindings[key]) {
					if (typeof bindings[key] !== 'object') {
						bindings[key] = [bindings[key]]
					}

					bindings[key].forEach((binding) => {
						const bindingList = Array.isArray(binding) ? binding : [binding]

						bindingList.forEach((item) => {
							this.mapBinding(key, item)
						})
					})
				}
			} else {
				console.warn('Key Binding Error - no such action:', key)
			}
		}
	}

	mapBinding(action, symbolsList) {
		const binding = {
			action: Keybindings.actions[action],
			keys: [],
			ctrl: false,
			shift: false,
			meta: false
		}

		const symbols = symbolsList.toString().toLowerCase().split(' ').join('').split('+')

		symbols.forEach((symbol) => {
			switch (symbol) {
				case 'ctrl':
					binding.ctrl = true
					break

				case 'shift':
					binding.shift = true
					break

				case 'meta':
					binding.meta = true
					break

				default:
					symbol = isNaN(symbol) ? symbol.toUpperCase().charCodeAt(0) : parseInt(symbol)
					binding.keys.push(symbol)

					if (!this.watchKeys[symbol]) {
						this.watchKeys[symbol] = []
					}

					this.watchKeys[symbol].push(binding)
			}
		})
	}

	bindEvents() {
		const self = this

		this.keyupBinding = function (e) {
			const code = e.keyCode
			const bindings = self.watchKeys[code]

			if (bindings) {
				self.pressedKeys.push(code)

				bindings.forEach(function (binding) {
					self.checkBinding(e, binding)
				})
			}
		}

		this.keydownBinding = function (e) {
			const code = e.keyCode
			const bindings = self.watchKeys[code]

			if (bindings) {
				const index = self.pressedKeys.indexOf(code)

				if (index > -1) {
					self.pressedKeys.splice(index, 1)
				}
			}
		}

		this.table.element.addEventListener('keydown', this.keyupBinding)

		this.table.element.addEventListener('keyup', this.keydownBinding)
	}

	clearBindings() {
		if (this.keyupBinding) {
			this.table.element.removeEventListener('keydown', this.keyupBinding)
		}

		if (this.keydownBinding) {
			this.table.element.removeEventListener('keyup', this.keydownBinding)
		}
	}

	checkBinding(e, binding) {
		let match = true

		if (e.ctrlKey == binding.ctrl && e.shiftKey == binding.shift && e.metaKey == binding.meta) {
			binding.keys.forEach((key) => {
				const index = this.pressedKeys.indexOf(key)

				if (index == -1) {
					match = false
				}
			})

			if (match) {
				binding.action.call(this, e)
			}

			return true
		}

		return false
	}
}
