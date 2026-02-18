import Module from '../../core/Module.js'

import defaultImporters from './defaults/importers.js'

export default class Import extends Module {
  static moduleName = 'import'

  // load defaults
  static importers = defaultImporters

  constructor(table) {
    super(table)

    this.registerTableOption('importFormat')
    this.registerTableOption('importReader', 'text')
    this.registerTableOption('importHeaderTransform')
    this.registerTableOption('importValueTransform')
    this.registerTableOption('importDataValidator')
    this.registerTableOption('importFileValidator')
  }

  initialize() {
    this.registerTableFunction('import', this.importFromFile.bind(this))

    if (this.table.options.importFormat) {
      this.subscribe('data-loading', this.loadDataCheck.bind(this), 10)
      this.subscribe('data-load', this.loadData.bind(this), 10)
    }
  }

  loadDataCheck(data) {
    const isImportableArray = Array.isArray(data) && data.length && Array.isArray(data)

    return this.table.options.importFormat && (typeof data === 'string' || isImportableArray)
  }

  loadData(data, params, config, silent, previousData) {
    return this.importData(this.lookupImporter(), data)
      .then(this.structureData.bind(this))
      .catch((err) => {
        console.error('Import Error:', err || 'Unable to import data')
        return Promise.reject(err)
      })
  }

  lookupImporter(importFormat) {
    const format = importFormat || this.table.options.importFormat
    const importer = typeof format === 'string' ? Import.importers[format] : format

    if (!importer) {
      console.error('Import Error - Importer not found:', format)
    }

    return importer
  }

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
        this.dispatch('import-error', err)
        this.dispatchExternal('importError', err)

        console.error('Import Error:', err || 'Unable to import file')

        this.table.dataLoader.alertError()

        setTimeout(() => {
          this.table.dataLoader.clearAlert()
        }, 3000)

        return Promise.reject(err)
      })
  }

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
            console.warn('File Load Error - Unable to read file')
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

  structureData(parsedData) {
    if (Array.isArray(parsedData) && parsedData.length && Array.isArray(parsedData[0])) {
      return this.table.options.autoColumns
        ? this.structureArrayToObject(parsedData)
        : this.structureArrayToColumns(parsedData)
    }

    return parsedData
  }

  mutateData(data) {
    if (Array.isArray(data)) {
      return data.map((row) => this.table.modules.mutator.transformRow(row, 'import'))
    }

    return data
  }

  transformHeader(headers) {
    if (this.table.options.importHeaderTransform) {
      return headers.map((item) => this.table.options.importHeaderTransform.call(this.table, item, headers))
    }

    return headers
  }

  transformData(row) {
    if (this.table.options.importValueTransform) {
      return row.map((item) => this.table.options.importValueTransform.call(this.table, item, row))
    }

    return row
  }

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

  validateFile(file) {
    if (this.table.options.importFileValidator) {
      return this.table.options.importFileValidator.call(this.table, file)
    }

    return true
  }

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

  setData(data) {
    this.dispatch('import-imported', data)
    this.dispatchExternal('importImported', data)

    this.table.dataLoader.clearAlert()

    return this.table.setData(data)
  }
}
