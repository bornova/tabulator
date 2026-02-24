import CoreFeature from '../CoreFeature.js'

export default class DependencyRegistry extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.deps = {}

    this.props = {}
  }

  /**
   * Initialize dependency map from table options.
   * @returns {void}
   */
  initialize() {
    this.deps = { ...this.options('dependencies') }
  }

  /**
   * Lookup a dependency by key and optional property.
   * @param {string|Array<string>} key Dependency key or list of fallback keys.
   * @param {string} [prop] Property name to resolve from the dependency.
   * @param {boolean} [silent] Suppress missing dependency error.
   * @returns {*}
   */
  lookup(key, prop, silent) {
    if (Array.isArray(key)) {
      let match

      for (const item of key) {
        match = this.lookup(item, prop, true)

        if (match) {
          break
        }
      }

      if (match) {
        return match
      } else {
        this.error(key)
      }
    } else {
      if (prop) {
        return this.lookupProp(key, prop, silent)
      } else {
        return this.lookupKey(key, silent)
      }
    }
  }

  /**
   * Lookup and cache a dependency property.
   * @param {string} key Dependency key.
   * @param {string} prop Property name.
   * @param {boolean} [silent] Suppress missing dependency error.
   * @returns {*}
   */
  lookupProp(key, prop, silent) {
    let dependency

    if (this.props[key] && this.props[key][prop]) {
      return this.props[key][prop]
    } else {
      dependency = this.lookupKey(key, silent)

      if (dependency) {
        if (!this.props[key]) {
          this.props[key] = {}
        }

        this.props[key][prop] = dependency[prop] || dependency
        return this.props[key][prop]
      }
    }
  }

  /**
   * Lookup a dependency by key.
   * @param {string} key Dependency key.
   * @param {boolean} [silent] Suppress missing dependency error.
   * @returns {*}
   */
  lookupKey(key, silent) {
    let dependency

    if (this.deps[key]) {
      dependency = this.deps[key]
    } else if (window[key]) {
      this.deps[key] = window[key]
      dependency = this.deps[key]
    } else {
      if (!silent) {
        this.error(key)
      }
    }

    return dependency
  }

  /**
   * Log a dependency lookup error.
   * @param {string|Array<string>} key Missing dependency key.
   * @returns {void}
   */
  error(key) {
    console.error(
      'Unable to find dependency',
      key,
      'Please check documentation and ensure you have imported the required library into your project'
    )
  }
}
