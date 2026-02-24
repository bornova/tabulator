import Module from '../../core/Module.js'

import defaultValidators from './defaults/validators.js'

export default class Validate extends Module {
  static moduleName = 'validate'

  // load defaults
  static validators = defaultValidators

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.invalidCells = []

    this.registerTableOption('validationMode', 'blocking')

    this.registerColumnOption('validator')

    this.registerTableFunction('getInvalidCells', this.getInvalidCells.bind(this))
    this.registerTableFunction('clearCellValidation', this.userClearCellValidation.bind(this))
    this.registerTableFunction('validate', this.userValidate.bind(this))

    this.registerComponentFunction('cell', 'isValid', this.cellIsValid.bind(this))
    this.registerComponentFunction('cell', 'clearValidation', this.clearValidation.bind(this))
    this.registerComponentFunction('cell', 'validate', this.cellValidate.bind(this))

    this.registerComponentFunction('column', 'validate', this.columnValidate.bind(this))
    this.registerComponentFunction('row', 'validate', this.rowValidate.bind(this))
  }

  /**
   * Bind validation lifecycle events.
   */
  initialize() {
    this.subscribe('cell-delete', this.clearValidation.bind(this))
    this.subscribe('column-layout', this.initializeColumnCheck.bind(this))

    this.subscribe('edit-success', this.editValidate.bind(this))
    this.subscribe('edit-editor-clear', this.editorClear.bind(this))
    this.subscribe('edit-edited-clear', this.editedClear.bind(this))
  }

  /// ////////////////////////////////
  /// ////// Event Handling //////////
  /// ////////////////////////////////

  /**
   * Validate edited cell value.
   * @param {object} cell Internal cell.
   * @param {*} value New value.
   * @returns {boolean|Array<object>}
   */
  editValidate(cell, value) {
    const valid =
      this.table.options.validationMode !== 'manual' ? this.validate(cell.column.modules.validate, cell, value) : true

    // allow time for editor to make render changes then style cell
    if (valid !== true) {
      setTimeout(() => {
        cell.getElement().classList.add('tabulator-validation-fail')
        this.dispatchExternal('validationFailed', cell.getComponent(), value, valid)
      })
    }

    return valid
  }

  /**
   * Clear editor validation state.
   * @param {object} cell Internal cell.
   * @param {boolean} cancelled Whether edit was cancelled.
   */
  editorClear(cell, cancelled) {
    if (cancelled) {
      if (cell.column.modules.validate) {
        this.cellValidate(cell)
      }
    }

    cell.getElement().classList.remove('tabulator-validation-fail')
  }

  /**
   * Clear edited marker validation state.
   * @param {object} cell Internal cell.
   */
  editedClear(cell) {
    if (cell.modules.validate) {
      cell.modules.validate.invalid = false
    }
  }

  /// ////////////////////////////////
  /// /////// Cell Functions /////////
  /// ////////////////////////////////

  /**
   * Determine if a cell is valid.
   * @param {object} cell Internal cell.
   * @returns {boolean}
   */
  cellIsValid(cell) {
    return !(cell.modules.validate && cell.modules.validate.invalid)
  }

  /**
   * Validate current value for a cell.
   * @param {object} cell Internal cell.
   * @returns {boolean|Array<object>}
   */
  cellValidate(cell) {
    return this.validate(cell.column.modules.validate, cell, cell.getValue())
  }

  /// ////////////////////////////////
  /// ////// Column Functions ////////
  /// ////////////////////////////////

  /**
   * Validate all cells in a column.
   * @param {object} column Internal column.
   * @returns {true|Array<object>}
   */
  columnValidate(column) {
    const invalid = []

    column.cells.forEach((cell) => {
      if (this.cellValidate(cell) !== true) {
        invalid.push(cell.getComponent())
      }
    })

    return invalid.length ? invalid : true
  }

  /// ////////////////////////////////
  /// /////// Row Functions //////////
  /// ////////////////////////////////

  /**
   * Validate all cells in a row.
   * @param {object} row Internal row.
   * @returns {true|Array<object>}
   */
  rowValidate(row) {
    const invalid = []

    row.cells.forEach((cell) => {
      if (this.cellValidate(cell) !== true) {
        invalid.push(cell.getComponent())
      }
    })

    return invalid.length ? invalid : true
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////

  /**
   * Clear validation state for one or more cells.
   * @param {object|Array<object>} [cells] Cell component(s).
   */
  userClearCellValidation(cells) {
    if (!cells) {
      cells = this.getInvalidCells()
    }

    if (!Array.isArray(cells)) {
      cells = [cells]
    }

    cells.forEach((cell) => {
      this.clearValidation(cell._getSelf())
    })
  }

  /**
   * Validate all rows in the table.
   * @returns {true|Array<object>}
   */
  userValidate() {
    let output = []

    // clear row data
    this.table.rowManager.rows.forEach((row) => {
      const valid = row.getComponent().validate()

      if (valid !== true) {
        output = output.concat(valid)
      }
    })

    return output.length ? output : true
  }

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Initialize column validator config when column defines validators.
   * @param {object} column Internal column.
   */
  initializeColumnCheck(column) {
    if (column.definition.validator !== undefined) {
      this.initializeColumn(column)
    }
  }

  /**
   * Build validator config for a column.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    const config = []

    if (column.definition.validator) {
      if (Array.isArray(column.definition.validator)) {
        column.definition.validator.forEach((item) => {
          const validator = this._extractValidator(item)

          if (validator) {
            config.push(validator)
          }
        })
      } else {
        const validator = this._extractValidator(column.definition.validator)

        if (validator) {
          config.push(validator)
        }
      }

      column.modules.validate = config.length ? config : false
    }
  }

  /**
   * Extract validator config from a validator descriptor.
   * @param {string|Function|object} value Validator descriptor.
   * @returns {object|false|undefined}
   */
  _extractValidator(value) {
    let type, params, pos

    switch (typeof value) {
      case 'string':
        pos = value.indexOf(':')

        if (pos > -1) {
          type = value.substring(0, pos)
          params = value.substring(pos + 1)
        } else {
          type = value
        }

        return this._buildValidator(type, params)

      case 'function':
        return this._buildValidator(value)

      case 'object':
        if (!value) {
          return false
        }

        return this._buildValidator(value.type, value.parameters)
    }
  }

  /**
   * Build normalized validator config object.
   * @param {string|Function} type Validator type or function.
   * @param {*} [params] Validator params.
   * @returns {object|false}
   */
  _buildValidator(type, params) {
    const func = typeof type === 'function' ? type : Validate.validators[type]

    if (!func) {
      console.warn('Validator Setup Error - No matching validator found:', type)
      return false
    }

    return {
      type: typeof type === 'function' ? 'function' : type,
      func,
      params
    }
  }

  /**
   * Validate a value against validator config.
   * @param {Array<object>|false} validators Validator config list.
   * @param {object} cell Internal cell.
   * @param {*} value Value to validate.
   * @returns {true|Array<object>}
   */
  validate(validators, cell, value) {
    const failedValidators = []
    const invalidIndex = this.invalidCells.indexOf(cell)

    if (validators) {
      validators.forEach((item) => {
        if (!item.func.call(this, cell.getComponent(), value, item.params)) {
          failedValidators.push({
            type: item.type,
            parameters: item.params
          })
        }
      })
    }

    if (!cell.modules.validate) {
      cell.modules.validate = {}
    }

    if (!failedValidators.length) {
      cell.modules.validate.invalid = false
      cell.getElement().classList.remove('tabulator-validation-fail')

      if (invalidIndex > -1) {
        this.invalidCells.splice(invalidIndex, 1)
      }
    } else {
      cell.modules.validate.invalid = failedValidators

      if (this.table.options.validationMode !== 'manual') {
        cell.getElement().classList.add('tabulator-validation-fail')
      }

      if (invalidIndex === -1) {
        this.invalidCells.push(cell)
      }
    }

    return failedValidators.length ? failedValidators : true
  }

  /**
   * Return invalid cell components.
   * @returns {Array<object>}
   */
  getInvalidCells() {
    return this.invalidCells.map((cell) => cell.getComponent())
  }

  /**
   * Clear validation state for an internal cell.
   * @param {object} cell Internal cell.
   */
  clearValidation(cell) {
    let invalidIndex

    if (cell.modules.validate && cell.modules.validate.invalid) {
      cell.getElement().classList.remove('tabulator-validation-fail')
      cell.modules.validate.invalid = false

      invalidIndex = this.invalidCells.indexOf(cell)

      if (invalidIndex > -1) {
        this.invalidCells.splice(invalidIndex, 1)
      }
    }
  }
}
