import * as coreModules from '../modules/core.js'
import TableRegistry from './TableRegistry.js'

export default class ModuleBinder extends TableRegistry {
  static moduleBindings = {}
  static moduleExtensions = {}
  static modulesRegistered = false

  static defaultModules = false

  /**
   * Create a module binder instance.
   */
  constructor() {
    super()
  }

  /**
   * Initialize global module registrations.
   * @param {object|Array<object>} [defaultModules] Additional modules to register.
   * @returns {void}
   */
  static initializeModuleBinder(defaultModules) {
    if (!ModuleBinder.modulesRegistered) {
      ModuleBinder.modulesRegistered = true
      ModuleBinder._registerModules(coreModules, true)

      if (defaultModules) {
        ModuleBinder._registerModules(defaultModules)
      }
    }
  }

  /**
   * Extend a module property with provided values.
   * @param {string} name Target module name.
   * @param {string} property Target module property.
   * @param {object} values Extension values.
   * @returns {void}
   */
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

  /**
   * Register a module collection.
   * @param {object} modules Module map or object.
   * @param {boolean} [core] Mark modules as core modules.
   * @returns {void}
   */
  static _registerModules(modules, core) {
    const mods = Object.values(modules)

    if (core) {
      mods.forEach((mod) => {
        mod.prototype.moduleCore = true
      })
    }

    ModuleBinder._registerModule(mods)
  }

  /**
   * Register one or more module constructors.
   * @param {object|Array<object>} modules Module constructor(s).
   * @returns {void}
   */
  static _registerModule(modules) {
    if (!Array.isArray(modules)) {
      modules = [modules]
    }

    modules.forEach((mod) => {
      ModuleBinder._registerModuleBinding(mod)
      ModuleBinder._registerModuleExtensions(mod)
    })
  }

  /**
   * Register a module by its `moduleName` binding.
   * @param {object} mod Module constructor.
   * @returns {void}
   */
  static _registerModuleBinding(mod) {
    if (mod.moduleName) {
      ModuleBinder.moduleBindings[mod.moduleName] = mod
    } else {
      console.error('Unable to bind module, no moduleName defined', mod)
    }
  }

  /**
   * Register module extensions and queue unresolved extensions.
   * @param {object} mod Module constructor.
   * @returns {void}
   */
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

  /**
   * Apply queued extensions for a newly registered module.
   * @param {object} mod Module constructor.
   * @returns {void}
   */
  static _extendModuleFromQueue(mod) {
    const extensions = ModuleBinder.moduleExtensions[mod.moduleName]

    if (extensions) {
      for (const propKey in extensions) {
        ModuleBinder._extendModule(mod.moduleName, propKey, extensions[propKey])
      }
    }
  }

  // ensure that module are bound to instantiated function
  /**
   * Instantiate and order all registered modules for this table.
   * @returns {void}
   */
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
