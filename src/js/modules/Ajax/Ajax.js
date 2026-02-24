import Module from '../../core/Module.js'

import defaultConfig from './defaults/config.js'
import defaultURLGenerator from './defaults/urlGenerator.js'
import defaultLoaderPromise from './defaults/loaderPromise.js'
import defaultContentTypeFormatters from './defaults/contentTypeFormatters.js'

export default class Ajax extends Module {
  static moduleName = 'ajax'

  // load defaults
  static defaultConfig = defaultConfig
  static defaultURLGenerator = defaultURLGenerator
  static defaultLoaderPromise = defaultLoaderPromise
  static contentTypeFormatters = defaultContentTypeFormatters

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.config = {} // hold config object for ajax request
    this.url = '' // request URL
    this.urlGenerator = false
    this.params = false // request parameters

    this.loaderPromise = false

    this.registerTableOption('ajaxURL', false) // url for ajax loading
    this.registerTableOption('ajaxURLGenerator', false)
    this.registerTableOption('ajaxParams', {}) // params for ajax loading
    this.registerTableOption('ajaxConfig', 'get') // ajax request type
    this.registerTableOption('ajaxContentType', 'form') // ajax request type
    this.registerTableOption('ajaxRequestFunc', false) // promise function

    this.registerTableOption('ajaxRequesting', function () {})
    this.registerTableOption('ajaxResponse', false)

    this.contentTypeFormatters = Ajax.contentTypeFormatters
  }

  // initialize setup options
  /**
   * Initialize ajax request handlers and defaults.
   */
  initialize() {
    this.loaderPromise = this.table.options.ajaxRequestFunc || Ajax.defaultLoaderPromise
    this.urlGenerator = this.table.options.ajaxURLGenerator || Ajax.defaultURLGenerator

    if (this.table.options.ajaxURL) {
      this.setUrl(this.table.options.ajaxURL)
    }

    this.setDefaultConfig(this.table.options.ajaxConfig)

    this.registerTableFunction('getAjaxUrl', this.getUrl.bind(this))

    this.subscribe('data-loading', this.requestDataCheck.bind(this))
    this.subscribe('data-params', this.requestParams.bind(this))
    this.subscribe('data-load', this.requestData.bind(this))
  }

  /**
   * Merge configured ajax params into request params.
   * @param {*} data Request data source.
   * @param {object} config Request config.
   * @param {boolean} silent Silent flag.
   * @param {object} params Existing params.
   * @returns {object}
   */
  requestParams(data, config, silent, params) {
    let ajaxParams = this.table.options.ajaxParams

    if (ajaxParams) {
      if (typeof ajaxParams === 'function') {
        ajaxParams = ajaxParams.call(this.table)
      }

      params = {
        ...ajaxParams,
        ...params
      }
    }

    return params
  }

  /**
   * Check if data load should be handled by ajax module.
   * @param {*} data Data source.
   * @returns {boolean}
   */
  requestDataCheck(data) {
    return (!data && this.url) || typeof data === 'string'
  }

  /**
   * Load remote data via ajax when applicable.
   * @param {string} url Request URL.
   * @param {object} params Request params.
   * @param {object|string} config Request config.
   * @param {boolean} silent Silent flag.
   * @param {*} previousData Previously loaded data.
   * @returns {Promise<*>|*}
   */
  requestData(url, params, config, silent, previousData) {
    let ajaxConfig

    if (!previousData && this.requestDataCheck(url)) {
      if (url) {
        this.setUrl(url)
      }

      ajaxConfig = this.generateConfig(config)

      return this.sendRequest(this.url, params, ajaxConfig)
    } else {
      return previousData
    }
  }

  /**
   * Set base ajax config.
   * @param {object|string} [config={}] Config object or method string.
   */
  setDefaultConfig(config = {}) {
    this.config = { ...Ajax.defaultConfig }

    if (typeof config === 'string') {
      this.config.method = config
    } else {
      this.config = {
        ...this.config,
        ...config
      }
    }
  }

  // load config object
  /**
   * Generate per-request ajax config.
   * @param {object|string} [config={}] Config override or method string.
   * @returns {object}
   */
  generateConfig(config = {}) {
    const ajaxConfig = { ...this.config }

    if (typeof config === 'string') {
      ajaxConfig.method = config
    } else {
      Object.assign(ajaxConfig, config)
    }

    return ajaxConfig
  }

  // set request url
  /**
   * Set ajax URL.
   * @param {string} url Request URL.
   */
  setUrl(url) {
    this.url = url
  }

  // get request url
  /**
   * Get ajax URL.
   * @returns {string}
   */
  getUrl() {
    return this.url
  }

  // send ajax request
  /**
   * Execute ajax request and post-process response.
   * @param {string} url Request URL.
   * @param {object} params Request params.
   * @param {object} config Request config.
   * @returns {Promise<*>}
   */
  async sendRequest(url, params, config) {
    if (this.table.options.ajaxRequesting.call(this.table, url, params) !== false) {
      return this.loaderPromise(url, config, params).then((data) => {
        if (this.table.options.ajaxResponse) {
          data = this.table.options.ajaxResponse.call(this.table, url, params, data)
        }

        return data
      })
    } else {
      return Promise.reject(new Error('Ajax request was cancelled by ajaxRequesting callback'))
    }
  }
}
