import CoreFeature from '../CoreFeature.js'

export default class DataLoader extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.requestOrder = 0 // prevent requests coming out of sequence if overridden by another load request
    this.loading = false
  }

  /**
   * Initialize data loader lifecycle.
   * @returns {void}
   */
  initialize() {}

  /**
   * Load data through the configured data pipeline.
   * @param {Array|object|string} data Data source payload or request descriptor.
   * @param {object} [params] Request params.
   * @param {object} [config] Request config.
   * @param {boolean} [replace] Replace existing table data.
   * @param {boolean} [silent] Suppress loading alerts.
   * @param {boolean} [columnsChanged] Force columns changed state.
   * @returns {Promise<void>}
   */
  async load(data, params, config, replace, silent, columnsChanged) {
    const requestNo = ++this.requestOrder

    if (this.table.destroyed) {
      return Promise.resolve()
    }

    this.dispatchExternal('dataLoading', data)

    // parse JSON-string data
    if (typeof data === 'string' && (data.indexOf('{') === 0 || data.indexOf('[') === 0)) {
      try {
        data = JSON.parse(data)
      } catch (error) {
        console.error('Data Load Error - Unable to parse JSON data: ', error)
        this.dispatchExternal('dataLoadError', error)

        if (!silent) {
          this.alertError()
        }

        setTimeout(() => {
          this.clearAlert()
        }, this.table.options.dataLoaderErrorTimeout)

        return Promise.reject(error)
      }
    }

    if (this.confirm('data-loading', [data, params, config, silent])) {
      this.loading = true

      if (!silent) {
        this.alertLoader()
      }

      // get params for request
      params = this.chain('data-params', [data, config, silent], params || {}, params || {})

      params = this.mapParams(params, this.table.options.dataSendParams)

      const result = this.chain('data-load', [data, params, config, silent], false, Promise.resolve([]))

      return result
        .then((response) => {
          if (!this.table.destroyed) {
            if (!Array.isArray(response) && typeof response === 'object') {
              response = this.mapParams(response, this.objectInvert(this.table.options.dataReceiveParams))
            }

            const rowData = this.chain('data-loaded', [response], null, response)

            if (requestNo === this.requestOrder) {
              this.clearAlert()

              if (rowData !== false) {
                this.dispatchExternal('dataLoaded', rowData)
                this.table.rowManager.setData(
                  rowData,
                  replace,
                  typeof columnsChanged === 'undefined' ? !replace : columnsChanged
                )
              }
            } else {
              console.warn(
                'Data Load Response Blocked - An active data load request was blocked by an attempt to change table data while the request was being made'
              )
            }
          } else {
            console.warn('Data Load Response Blocked - Table has been destroyed')
          }
        })
        .catch((error) => {
          console.error('Data Load Error: ', error)
          this.dispatchExternal('dataLoadError', error)

          if (!silent) {
            this.alertError()
          }

          setTimeout(() => {
            this.clearAlert()
          }, this.table.options.dataLoaderErrorTimeout)
        })
        .finally(() => {
          this.loading = false
        })
    } else {
      this.dispatchExternal('dataLoaded', data)

      if (!data) {
        data = []
      }

      this.table.rowManager.setData(data, replace, typeof columnsChanged === 'undefined' ? !replace : columnsChanged)
      return Promise.resolve()
    }
  }

  /**
   * Remap object keys using a provided map.
   * @param {object} params Source object.
   * @param {object} map Key mapping object.
   * @returns {object}
   */
  mapParams(params, map) {
    const output = {}

    for (const key in params) {
      output[Object.prototype.hasOwnProperty.call(map, key) ? map[key] : key] = params[key]
    }

    return output
  }

  /**
   * Invert an object's keys and values.
   * @param {object} obj Source object.
   * @returns {object}
   */
  objectInvert(obj) {
    const output = {}

    for (const key in obj) {
      output[obj[key]] = key
    }

    return output
  }

  /**
   * Invalidate any in-flight load response.
   * @returns {void}
   */
  blockActiveLoad() {
    this.requestOrder++
  }

  /**
   * Show loading alert if enabled.
   * @returns {void}
   */
  alertLoader() {
    const shouldLoad =
      typeof this.table.options.dataLoader === 'function'
        ? this.table.options.dataLoader()
        : this.table.options.dataLoader

    if (shouldLoad) {
      this.table.alertManager.alert(this.table.options.dataLoaderLoading || this.langText('data|loading'))
    }
  }

  /**
   * Show data-load error alert.
   * @returns {void}
   */
  alertError() {
    this.table.alertManager.alert(this.table.options.dataLoaderError || this.langText('data|error'), 'error')
  }

  /**
   * Clear active loader/alert message.
   * @returns {void}
   */
  clearAlert() {
    this.table.alertManager.clear()
  }
}
