import * as coreModules from '../modules/core.js'
import TableRegistry from './TableRegistry.js'

export default class ModuleBinder extends TableRegistry {
	static moduleBindings = {}
	static moduleExtensions = {}
	static modulesRegistered = false

	static defaultModules = false

	constructor() {
		super()
	}

	static initializeModuleBinder(defaultModules) {
		if (!ModuleBinder.modulesRegistered) {
			ModuleBinder.modulesRegistered = true
			ModuleBinder._registerModules(coreModules, true)

			if (defaultModules) {
				ModuleBinder._registerModules(defaultModules)
			}
		}
	}

	static _extendModule(name, property, values) {
		if (ModuleBinder.moduleBindings[name]) {
			const source = ModuleBinder.moduleBindings[name][property]

			if (source) {
				if (typeof values === 'object') {
					for (const key in values) {
						source[key] = values[key]
					}
				} else {
					console.warn('Module Error - Invalid value type, it must be an object')
				}
			} else {
				console.warn('Module Error - property does not exist:', property)
			}
		} else {
			console.warn('Module Error - module does not exist:', name)
		}
	}

	static _registerModules(modules, core) {
		const mods = Object.values(modules)

		if (core) {
			mods.forEach((mod) => {
				mod.prototype.moduleCore = true
			})
		}

		ModuleBinder._registerModule(mods)
	}

	static _registerModule(modules) {
		if (!Array.isArray(modules)) {
			modules = [modules]
		}

		modules.forEach((mod) => {
			ModuleBinder._registerModuleBinding(mod)
			ModuleBinder._registerModuleExtensions(mod)
		})
	}

	static _registerModuleBinding(mod) {
		if (mod.moduleName) {
			ModuleBinder.moduleBindings[mod.moduleName] = mod
		} else {
			console.error('Unable to bind module, no moduleName defined', mod.moduleName)
		}
	}

	static _registerModuleExtensions(mod) {
		const extensions = mod.moduleExtensions

		if (mod.moduleExtensions) {
			for (const modKey in extensions) {
				const ext = extensions[modKey]

				if (ModuleBinder.moduleBindings[modKey]) {
					for (const propKey in ext) {
						ModuleBinder._extendModule(modKey, propKey, ext[propKey])
					}
				} else {
					if (!ModuleBinder.moduleExtensions[modKey]) {
						ModuleBinder.moduleExtensions[modKey] = {}
					}

					for (const propKey in ext) {
						if (!ModuleBinder.moduleExtensions[modKey][propKey]) {
							ModuleBinder.moduleExtensions[modKey][propKey] = {}
						}

						Object.assign(ModuleBinder.moduleExtensions[modKey][propKey], ext[propKey])
					}
				}
			}
		}

		ModuleBinder._extendModuleFromQueue(mod)
	}

	static _extendModuleFromQueue(mod) {
		const extensions = ModuleBinder.moduleExtensions[mod.moduleName]

		if (extensions) {
			for (const propKey in extensions) {
				ModuleBinder._extendModule(mod.moduleName, propKey, extensions[propKey])
			}
		}
	}

	// ensure that module are bound to instantiated function
	_bindModules() {
		const orderedStartMods = []
		const orderedEndMods = []
		const unOrderedMods = []

		this.modules = {}

		for (const name in ModuleBinder.moduleBindings) {
			const mod = ModuleBinder.moduleBindings[name]
			const module = new mod(this)

			this.modules[name] = module

			if (mod.prototype.moduleCore) {
				this.modulesCore.push(module)
			} else {
				if (mod.moduleInitOrder) {
					if (mod.moduleInitOrder < 0) {
						orderedStartMods.push(module)
					} else {
						orderedEndMods.push(module)
					}
				} else {
					unOrderedMods.push(module)
				}
			}
		}

		orderedStartMods.sort((a, b) => (a.moduleInitOrder > b.moduleInitOrder ? 1 : -1))
		orderedEndMods.sort((a, b) => (a.moduleInitOrder > b.moduleInitOrder ? 1 : -1))

		this.modulesRegular = orderedStartMods.concat(unOrderedMods.concat(orderedEndMods))
	}
}
