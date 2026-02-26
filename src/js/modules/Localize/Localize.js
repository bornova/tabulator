import Module from '../../core/Module.js'

import Helpers from '../../core/tools/Helpers.js'

import defaultLangs from './defaults/langs.js'

export default class Localize extends Module {
  static moduleName = 'localize'

  // load defaults
  static langs = defaultLangs

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.locale = 'default' // current locale
    this.lang = false // current language
    this.bindings = {} // update events to call when locale is changed
    this.langList = {}

    this.registerTableOption('locale', false) // current system language
    this.registerTableOption('langs', {})
  }

  /**
   * Initialize localization data and table-level localization functions.
   */
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
  /**
   * Override the default header filter placeholder text.
   * @param {string} placeholder Placeholder text.
   */
  setHeaderFilterPlaceholder(placeholder) {
    this.langList.default.headerFilters.default = placeholder
  }

  // setup a lang description object
  /**
   * Install or merge a locale definition.
   * @param {string} locale Locale key.
   * @param {object} lang Locale definition object.
   */
  installLang(locale, lang) {
    if (this.langList[locale]) {
      this._setLangProp(this.langList[locale], lang)
    } else {
      this.langList[locale] = lang
    }
  }

  /**
   * Recursively merge localized values into an existing language tree.
   * @param {object} lang Target language object.
   * @param {object} values Source values.
   */
  _setLangProp(lang, values) {
    for (const key in values) {
      if (lang[key] && typeof lang[key] === 'object' && values[key] && typeof values[key] === 'object') {
        this._setLangProp(lang[key], values[key])
      } else {
        lang[key] = values[key]
      }
    }
  }

  // set current locale
  /**
   * Set active locale and rebuild the language map.
   * @param {string|boolean} desiredLocale Locale key or true for browser locale.
   */
  setLocale(desiredLocale) {
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

    let locale = desiredLocale || 'default'

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
  /**
   * Get active locale key.
   * @returns {string}
   */
  getLocale() {
    return this.locale
  }

  // get lang object for given local or current if none provided
  /**
   * Get language object for a locale or the currently active language.
   * @param {string} [locale] Locale key.
   * @returns {object|boolean}
   */
  getLang(locale) {
    return locale ? this.langList[locale] : this.lang
  }

  // get text for current locale
  /**
   * Resolve localized text for a language path.
   * @param {string} path Dot-path-like key.
   * @param {string} [value] Optional sub-key or value segment.
   * @returns {string}
   */
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
  /**
   * Traverse active language object and return a nested value.
   * @param {Array<string>} path Path segments.
   * @returns {*}
   */
  _getLangElement(path) {
    let root = this.lang

    for (const level of path) {
      if (!root) {
        break
      }

      const rootPath = root[level]

      root = rootPath !== undefined ? rootPath : false
    }

    return root
  }

  // set update binding
  /**
   * Bind a callback to locale updates for a language key.
   * @param {string} path Translation key path.
   * @param {Function} callback Update callback.
   */
  bind(path, callback) {
    if (!this.bindings[path]) {
      this.bindings[path] = []
    }

    this.bindings[path].push(callback)

    callback(this.getText(path), this.lang)
  }

  // iterate through bindings and trigger updates
  /**
   * Execute all registered localization bindings.
   */
  _executeBindings() {
    for (const path in this.bindings) {
      this.bindings[path].forEach((binding) => {
        binding(this.getText(path), this.lang)
      })
    }
  }
}
