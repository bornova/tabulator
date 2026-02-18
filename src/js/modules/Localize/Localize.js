import Module from '../../core/Module.js'

import Helpers from '../../core/tools/Helpers.js'

import defaultLangs from './defaults/langs.js'

export default class Localize extends Module {
  static moduleName = 'localize'

  // load defaults
  static langs = defaultLangs

  constructor(table) {
    super(table)

    this.locale = 'default' // current locale
    this.lang = false // current language
    this.bindings = {} // update events to call when locale is changed
    this.langList = {}

    this.registerTableOption('locale', false) // current system language
    this.registerTableOption('langs', {})
  }

  initialize() {
    this.langList = Helpers.deepClone(Localize.langs)

    if (this.table.options.columnDefaults.headerFilterPlaceholder !== false) {
      this.setHeaderFilterPlaceholder(this.table.options.columnDefaults.headerFilterPlaceholder)
    }

    for (const locale in this.table.options.langs) {
      this.installLang(locale, this.table.options.langs[locale])
    }

    this.setLocale(this.table.options.locale)

    this.registerTableFunction('setLocale', this.setLocale.bind(this))
    this.registerTableFunction('getLocale', this.getLocale.bind(this))
    this.registerTableFunction('getLang', this.getLang.bind(this))
  }

  // set header placeholder
  setHeaderFilterPlaceholder(placeholder) {
    this.langList.default.headerFilters.default = placeholder
  }

  // setup a lang description object
  installLang(locale, lang) {
    if (this.langList[locale]) {
      this._setLangProp(this.langList[locale], lang)
    } else {
      this.langList[locale] = lang
    }
  }

  _setLangProp(lang, values) {
    for (const key in values) {
      if (lang[key] && typeof lang[key] === 'object') {
        this._setLangProp(lang[key], values[key])
      } else {
        lang[key] = values[key]
      }
    }
  }

  // set current locale
  setLocale(desiredLocale) {
    let locale = desiredLocale || 'default'

    // fill in any matching language values
    const traverseLang = (trans, path) => {
      for (const prop in trans) {
        if (typeof trans[prop] === 'object') {
          if (!path[prop]) {
            path[prop] = {}
          }
          traverseLang(trans[prop], path[prop])
        } else {
          path[prop] = trans[prop]
        }
      }
    }

    // determining correct locale to load
    if (locale === true && navigator.language) {
      // get local from system
      locale = navigator.language.toLowerCase()
    }

    if (locale) {
      // if locale is not set, check for matching top level locale else use default
      if (!this.langList[locale]) {
        const prefix = locale.split('-')[0]

        if (this.langList[prefix]) {
          console.warn('Localization Error - Exact matching locale not found, using closest match: ', locale, prefix)
          locale = prefix
        } else {
          console.warn('Localization Error - Matching locale not found, using default: ', locale)
          locale = 'default'
        }
      }
    }

    this.locale = locale

    // load default lang template
    this.lang = Helpers.deepClone(this.langList.default || {})

    if (locale !== 'default') {
      traverseLang(this.langList[locale], this.lang)
    }

    this.dispatchExternal('localized', this.locale, this.lang)

    this._executeBindings()
  }

  // get current locale
  getLocale() {
    return this.locale
  }

  // get lang object for given local or current if none provided
  getLang(locale) {
    return locale ? this.langList[locale] : this.lang
  }

  // get text for current locale
  getText(path, value) {
    const fillPath = value ? `${path}|${value}` : path
    const pathArray = fillPath.split('|')
    const text = this._getLangElement(pathArray)

    // if(text === false){
    // 	console.warn("Localization Error - Matching localized text not found for given path: ", path);
    // }

    return text || ''
  }

  // traverse langs object and find localized copy
  _getLangElement(path) {
    let root = this.lang

    for (const level of path) {
      if (!root) {
        break
      }

      const rootPath = root[level]
      root = typeof rootPath !== 'undefined' ? rootPath : false
    }

    return root
  }

  // set update binding
  bind(path, callback) {
    if (!this.bindings[path]) {
      this.bindings[path] = []
    }

    this.bindings[path].push(callback)

    callback(this.getText(path), this.lang)
  }

  // iterate through bindings and trigger updates
  _executeBindings() {
    for (const path in this.bindings) {
      this.bindings[path].forEach((binding) => {
        binding(this.getText(path), this.lang)
      })
    }
  }
}
