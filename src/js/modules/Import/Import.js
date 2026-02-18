import Module from '../../core/Module.js'

import defaultImporters from './defaults/importers.js'

export default class Import extends Module {
  static moduleName = 'import'

  // load defaults
  static importers = defaultImporters

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.registerTableOption('importFormat')
    this.registerTableOption('importReader', 'text')
    this.registerTableOption('importHeaderTransform')
    this.registerTableOption('importValueTransform')
    this.registerTableOption('importDataValidator')
    this.registerTableOption('importFileValidator')
  }

  /**
   * Initialize import table function and data-load hooks.
   * @returns {void}
   */
  initialize() {
    this.registerTableFunction('import', this.importFromFile.bind(this))

    if (this.table.options.importFormat) {
      this.subscribe('data-loading', this.loadDataCheck.bind(this), 10)
      this.subscribe('data-load', this.loadData.bind(this), 10)
    }
  }

  /**
   * Emit and log an import error.
   * @param {string} message Error message.
   * @param {...*} details Additional details.
   * @returns {void}
   */
  logImportError(message, ...details) {
    const error = { message, details }

    this.dispatch('import-error', error)
    this.dispatchExternal('importError', error)

    console.error(message, ...details)
  }

  /**
   * Emit and log an import warning.
   * @param {string} message Warning message.
   * @param {...*} details Additional details.
   * @returns {void}
   */
  logImportWarning(message, ...details) {
    const warning = { message, details }

    this.dispatch('import-warning', warning)
    this.dispatchExternal('importWarning', warning)

    console.warn(message, ...details)
  }

  /**
   * Check whether incoming data should be treated as import input.
   * @param {*} data Incoming data payload.
   * @returns {boolean}
   */
  loadDataCheck(data) {
    const isImportableArray = Array.isArray(data) && data.length && Array.isArray(data)

    return this.table.options.importFormat && (typeof data === 'string' || isImportableArray)
  }

  /**
   * Import and structure data loaded through standard data pipeline.
   * @param {*} data Raw data.
   * @param {object} params Load params.
   * @param {object} config Load config.
   * @param {boolean} silent Silent flag.
   * @param {*} previousData Previous data.
   * @returns {Promise<*>}
   */
  loadData(data, params, config, silent, previousData) {
    return this.importData(this.lookupImporter(), data)
      .then(this.structureData.bind(this))
      .catch((err) => {
        this.logImportError('Import Error:', err || 'Unable to import data')
        return Promise.reject(err)
      })
  }

  /**
   * Resolve importer function from option or explicit format.
   * @param {string|Function} [importFormat] Import format key or importer function.
   * @returns {Function|undefined}
   */
  lookupImporter(importFormat) {
    const format = importFormat || this.table.options.importFormat
    const importer = typeof format === 'string' ? Import.importers[format] : format

    if (!importer) {
      this.logImportError('Import Error - Importer not found:', format)
    }

    return importer
  }

  /**
   * Open file picker, import selected file, and load data into the table.
   * @param {string|Function} importFormat Import format key or importer function.
   * @param {string} extension Accepted file extension string.
   * @param {'text'|'buffer'|'binary'|'url'} [importReader] FileReader mode.
   * @returns {Promise<*>|undefined}
   */
  importFromFile(importFormat, extension, importReader) {
    const importer = this.lookupImporter(importFormat)

    if (!importer) {
      return
    }

    return this.pickFile(extension, importReader)
      .then(this.importData.bind(this, importer))
      .then(this.structureData.bind(this))
      .then(this.mutateData.bind(this))
      .then(this.validateData.bind(this))
      .then(this.setData.bind(this))
      .catch((err) => {
        this.logImportError('Import Error:', err || 'Unable to import file')

        this.table.dataLoader.alertError()

        setTimeout(() => {
          this.table.dataLoader.clearAlert()
        }, 3000)

        return Promise.reject(err)
      })
  }

  /**
   * Prompt user to pick a file and read its contents.
   * @param {string} extensions Accepted file extensions.
   * @param {'text'|'buffer'|'binary'|'url'} [importReader] FileReader mode.
   * @returns {Promise<*>}
   */
  pickFile(extensions, importReader) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = extensions

      input.addEventListener('change', () => {
        const file = input.files[0]
        const reader = new FileReader()
        const valid = this.validateFile(file)

        if (valid === true) {
          this.dispatch('import-importing', input.files)
          this.dispatchExternal('importImporting', input.files)

          switch (importReader || this.table.options.importReader) {
            case 'buffer':
              reader.readAsArrayBuffer(file)
              break

            case 'binary':
              reader.readAsBinaryString(file)
              break

            case 'url':
              reader.readAsDataURL(file)
              break

            case 'text':
            default:
              reader.readAsText(file)
          }

          reader.onload = () => {
            resolve(reader.result)
          }

          reader.onerror = (e) => {
            this.logImportWarning('File Load Error - Unable to read file')
            reject(e)
          }
        } else {
          reject(valid)
        }
      })

      this.dispatch('import-choose')
      this.dispatchExternal('importChoose')
      input.click()
    })
  }

  /**
   * Execute importer and return parsed data.
   * @param {Function} importer Importer function.
   * @param {*} fileContents File contents.
   * @returns {Promise<*>}
   */
  importData(importer, fileContents) {
    this.table.dataLoader.alertLoader()

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = importer.call(this.table, fileContents)

        if (data instanceof Promise) {
          resolve(data)
        } else {
          data ? resolve(data) : reject()
        }
      }, 10)
    })
  }

  /**
   * Normalize parsed import data shape for table consumption.
   * @param {*} parsedData Parsed input data.
   * @returns {*}
   */
  structureData(parsedData) {
    if (Array.isArray(parsedData) && parsedData.length && Array.isArray(parsedData[0])) {
      return this.table.options.autoColumns
        ? this.structureArrayToObject(parsedData)
        : this.structureArrayToColumns(parsedData)
    }

    return parsedData
  }

  /**
   * Run import mutators on imported row data.
   * @param {*} data Data to mutate.
   * @returns {*}
   */
  mutateData(data) {
    if (Array.isArray(data)) {
      return data.map((row) => this.table.modules.mutator.transformRow(row, 'import'))
    }

    return data
  }

  /**
   * Transform imported header values.
   * @param {Array<*>} headers Header row.
   * @returns {Array<*>}
   */
  transformHeader(headers) {
    if (this.table.options.importHeaderTransform) {
      return headers.map((item) => this.table.options.importHeaderTransform.call(this.table, item, headers))
    }

    return headers
  }

  /**
   * Transform imported row values.
   * @param {Array<*>} row Row values.
   * @returns {Array<*>}
   */
  transformData(row) {
    if (this.table.options.importValueTransform) {
      return row.map((item) => this.table.options.importValueTransform.call(this.table, item, row))
    }

    return row
  }

  /**
   * Convert array-based import data into row objects using first row headers.
   * @param {Array<Array<*>>} parsedData Parsed data.
   * @returns {Array<object>}
   */
  structureArrayToObject(parsedData) {
    const columns = this.transformHeader(parsedData.shift())

    const data = parsedData.map((values) => {
      const row = {}
      const transformedValues = this.transformData(values)

      columns.forEach((key, i) => {
        row[key] = transformedValues[i]
      })

      return row
    })

    return data
  }

  /**
   * Convert array-based import data into row objects using table columns.
   * @param {Array<Array<*>>} parsedData Parsed data.
   * @returns {Array<object>}
   */
  structureArrayToColumns(parsedData) {
    const data = []
    const firstRow = this.transformHeader(parsedData[0])
    const columns = this.table.getColumns()

    // remove first row if it is the column names
    if (columns[0] && firstRow[0]) {
      if (columns[0].getDefinition().title === firstRow[0]) {
        parsedData.shift()
      }
    }

    // convert row arrays to objects
    parsedData.forEach((rowData) => {
      const row = {}
      const transformedRowData = this.transformData(rowData)

      transformedRowData.forEach((value, index) => {
        const column = columns[index]

        if (column) {
          row[column.getField()] = value
        }
      })

      data.push(row)
    })

    return data
  }

  /**
   * Validate selected file before import.
   * @param {File} file Selected file.
   * @returns {*}
   */
  validateFile(file) {
    if (this.table.options.importFileValidator) {
      return this.table.options.importFileValidator.call(this.table, file)
    }

    return true
  }

  /**
   * Validate imported data before setting table data.
   * @param {*} data Imported data.
   * @returns {Promise<*>|*}
   */
  validateData(data) {
    if (this.table.options.importDataValidator) {
      const result = this.table.options.importDataValidator.call(this.table, data)

      if (result === true) {
        return data
      }

      return Promise.reject(result)
    }

    return data
  }

  /**
   * Dispatch import-complete events and set table data.
   * @param {*} data Validated import data.
   * @returns {Promise<*>}
   */
  setData(data) {
    this.dispatch('import-imported', data)
    this.dispatchExternal('importImported', data)

    this.table.dataLoader.clearAlert()

    return this.table.setData(data)
  }
}
