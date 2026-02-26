import Module from '../../core/Module.js'

import defaultDownloaders from './defaults/downloaders.js'

export default class Download extends Module {
  static moduleName = 'download'

  // load defaults
  static downloaders = defaultDownloaders

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.registerTableOption('downloadEncoder', function (data, mimeType) {
      return new Blob([data], { type: mimeType })
    }) // function to manipulate download data
    this.registerTableOption('downloadConfig', {}) // download config
    this.registerTableOption('downloadRowRange', 'active') // restrict download to active rows only

    this.registerColumnOption('download')
    this.registerColumnOption('titleDownload')
  }

  /**
   * Register table download functions.
   */
  initialize() {
    this.deprecatedOptionsCheck()

    this.registerTableFunction('download', this.download.bind(this))
    this.registerTableFunction('downloadToTab', this.downloadToTab.bind(this))
  }

  /**
   * Check deprecated download options.
   */
  deprecatedOptionsCheck() {}

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////

  /**
   * Download data and open in a new browser tab.
   * @param {string|Function} type Download type or custom generator.
   * @param {string} [filename] Output filename.
   * @param {object} [options] Downloader options.
   * @param {string} [active] Row range selector.
   */
  downloadToTab(type, filename, options, active) {
    this.download(type, filename, options, active, true)
  }

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Generate and trigger a download.
   * @param {string|Function} type Download type or custom generator.
   * @param {string} [filename] Output filename.
   * @param {object} [options] Downloader options.
   * @param {string} [range] Export row range.
   * @param {boolean|Function} [interceptCallback] Intercept callback or open-in-tab flag.
   */
  download(type, filename, options, range, interceptCallback) {
    let downloadFunc = false

    const buildLink = (data, mime) => {
      if (interceptCallback) {
        if (interceptCallback === true) {
          this.triggerDownload(data, mime, type, filename, true)
        } else {
          interceptCallback(data)
        }
      } else {
        this.triggerDownload(data, mime, type, filename)
      }
    }

    if (typeof type === 'function') {
      downloadFunc = type
    } else if (Download.downloaders[type]) {
      downloadFunc = Download.downloaders[type]
    } else {
      console.warn('Download Error - No such download type found: ', type)
    }

    if (downloadFunc) {
      const list = this.generateExportList(range)

      downloadFunc.call(this.table, list, options || {}, buildLink)
    }
  }

  /**
   * Generate export list for download.
   * @param {string} [range] Export row range.
   * @returns {Array<object>}
   */
  generateExportList(range) {
    const list = this.table.modules.export.generateExportList(
      this.table.options.downloadConfig,
      false,
      range || this.table.options.downloadRowRange,
      'download'
    )

    // assign group header formatter
    let groupHeader = this.table.options.groupHeaderDownload

    if (groupHeader && !Array.isArray(groupHeader)) {
      groupHeader = [groupHeader]
    }

    list.forEach((row) => {
      let group

      if (row.type === 'group') {
        group = row.columns[0]

        if (groupHeader && groupHeader[row.indent]) {
          group.value = groupHeader[row.indent](
            group.value,
            row.component._group.getRowCount(),
            row.component._group.getData(),
            row.component
          )
        }
      }
    })

    return list
  }

  /**
   * Trigger browser download/open for generated data.
   * @param {*} data Encoded data.
   * @param {string} mime Mime type.
   * @param {string|Function} type Download type.
   * @param {string} [filename] Output filename.
   * @param {boolean} [newTab] Open output in new tab.
   */
  triggerDownload(data, mime, type, filename, newTab) {
    const element = document.createElement('a')
    const blob = this.table.options.downloadEncoder(data, mime)

    let blobUrl

    if (blob) {
      blobUrl = window.URL.createObjectURL(blob)

      if (newTab) {
        window.open(blobUrl)
      } else {
        filename = filename || `Tabulator.${typeof type === 'function' ? 'txt' : type}`

        if (navigator.msSaveOrOpenBlob) {
          navigator.msSaveOrOpenBlob(blob, filename)
        } else {
          element.setAttribute('href', blobUrl)

          // set file title
          element.setAttribute('download', filename)

          // trigger download
          element.classList.add('tabulator-display-none')
          document.body.appendChild(element)
          element.click()

          // remove temporary link element
          document.body.removeChild(element)
        }
      }

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
      }, 1000)

      this.dispatchExternal('downloadComplete')
    }
  }

  /**
   * Handle communications messages for download actions.
   * @param {*} table Source table.
   * @param {string} action Action key.
   * @param {object} data Action payload.
   */
  commsReceived(table, action, data) {
    switch (action) {
      case 'intercept':
        this.download(data.type, '', data.options, data.active, data.intercept)
        break
    }
  }
}
