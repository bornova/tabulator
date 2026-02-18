const isEmptyValue = (value) => value === '' || value === null || typeof value === 'undefined'
const alphaNumericPattern = /^[a-z0-9]+$/i

export default {
  // is integer
  integer(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    value = Number(value)

    return !isNaN(value) && isFinite(value) && Math.floor(value) === value
  },

  // is float
  float(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    value = Number(value)

    return !isNaN(value) && isFinite(value) && value % 1 !== 0
  },

  // must be a number
  numeric(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return !isNaN(value)
  },

  // must be a string
  string(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return isNaN(value)
  },

  // must be alphanumeric
  alphanumeric(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return alphaNumericPattern.test(value)
  },

  // maximum value
  max(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return parseFloat(value) <= parameters
  },

  // minimum value
  min(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return parseFloat(value) >= parameters
  },

  // starts with  value
  starts(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return String(value).toLowerCase().startsWith(String(parameters).toLowerCase())
  },

  // ends with  value
  ends(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return String(value).toLowerCase().endsWith(String(parameters).toLowerCase())
  },

  // minimum string length
  minLength(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return String(value).length >= parameters
  },

  // maximum string length
  maxLength(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    return String(value).length <= parameters
  },

  // in provided value list
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
  regex(cell, value, parameters) {
    if (isEmptyValue(value)) {
      return true
    }

    const reg = new RegExp(parameters)

    return reg.test(value)
  },

  // value must be unique in this column
  unique(cell, value, parameters) {
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
  required(cell, value, parameters) {
    return !isEmptyValue(value)
  }
}
