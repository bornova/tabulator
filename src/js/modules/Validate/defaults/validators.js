/**
 * Check whether a value is considered empty for validation.
 * @param {*} value Value to check.
 * @returns {boolean}
 */
const isEmptyValue = (value) => value === '' || value === null || typeof value === 'undefined'

/**
 * Alphanumeric validation regex.
 * @type {RegExp}
 */
const alphaNumericPattern = /^[a-z0-9]+$/i

export default {
  // is integer
  /**
   * Validate integer values.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @returns {boolean}
   */
  integer(cell, value) {
    if (isEmptyValue(value)) {
      return true
    }

    value = Number(value)

    return !Number.isNaN(value) && Number.isFinite(value) && Math.floor(value) === value
  },

  // is float
  /**
   * Validate floating-point values.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @returns {boolean}
   */
  float(cell, value) {
    if (isEmptyValue(value)) {
      return true
    }

    value = Number(value)

    return !Number.isNaN(value) && Number.isFinite(value) && value % 1 !== 0
  },

  // must be a number
  /**
   * Validate numeric values.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @returns {boolean}
   */
  numeric(cell, value) {
    if (isEmptyValue(value)) {
      return true
    }

    return !Number.isNaN(Number(value))
  },

  // must be a string
  /**
   * Validate non-numeric/string-like values.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @returns {boolean}
   */
  string(cell, value) {
    if (isEmptyValue(value)) {
      return true
    }

    return Number.isNaN(Number(value))
  },

  // must be alphanumeric
  /**
   * Validate alphanumeric values.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @returns {boolean}
   */
  alphanumeric(cell, value) {
    if (isEmptyValue(value)) {
      return true
    }

    return alphaNumericPattern.test(value)
  },

  // maximum value
  /**
   * Validate value does not exceed max.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @param {number} parameters Max value.
   * @returns {boolean}
   */
  max(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return parseFloat(value) <= parameters
  },

  // minimum value
  /**
   * Validate value is at least min.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @param {number} parameters Min value.
   * @returns {boolean}
   */
  min(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return parseFloat(value) >= parameters
  },

  // starts with  value
  /**
   * Validate value starts with parameter.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @param {*} parameters Prefix.
   * @returns {boolean}
   */
  starts(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return String(value).toLowerCase().startsWith(String(parameters).toLowerCase())
  },

  // ends with  value
  /**
   * Validate value ends with parameter.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @param {*} parameters Suffix.
   * @returns {boolean}
   */
  ends(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return String(value).toLowerCase().endsWith(String(parameters).toLowerCase())
  },

  // minimum string length
  /**
   * Validate minimum string length.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @param {number} parameters Minimum length.
   * @returns {boolean}
   */
  minLength(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return String(value).length >= parameters
  },

  // maximum string length
  /**
   * Validate maximum string length.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @param {number} parameters Maximum length.
   * @returns {boolean}
   */
  maxLength(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return String(value).length <= parameters
  },

  // in provided value list
  /**
   * Validate value exists in provided list.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @param {Array<*>|string} parameters Allowed values.
   * @returns {boolean}
   */
  in(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    if (typeof parameters === 'string') {
      parameters = parameters.split('|')
    }

    return parameters.indexOf(value) > -1
  },

  // must match provided regex
  /**
   * Validate value against regex pattern.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @param {string} parameters Regex source string.
   * @returns {boolean}
   */
  regex(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    let reg

    try {
      reg = new RegExp(parameters)
    } catch {
      return false
    }

    return reg.test(value)
  },

  // value must be unique in this column
  /**
   * Validate value uniqueness within column.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @returns {boolean}
   */
  unique(cell, value) {
    if (isEmptyValue(value)) {
      return true
    }

    const cellData = cell.getData()
    const column = cell.getColumn()._getSelf()

    for (const row of this.table.rowManager.rows) {
      const data = row.getData()

      if (data !== cellData && value == column.getFieldValue(data)) {
        return false
      }
    }

    return true
  },

  // must have a value
  /**
   * Validate value is required and non-empty.
   * @param {object} cell Cell component.
   * @param {*} value Cell value.
   * @returns {boolean}
   */
  required(cell, value) {
    return !isEmptyValue(value)
  }
}
