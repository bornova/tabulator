/**
 * Default filter comparison functions.
 *
 * @type {Object<string, function(*, *, Object, Object): boolean>}
 */
export default {
  // equal to
  /**
   * Compare for equality.
   *
   * @param {*} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if values are equal.
   */
  '='(filterVal, rowVal) {
    return rowVal == filterVal
  },

  // less than
  /**
   * Compare for less than.
   *
   * @param {*} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if row value is less than filter value.
   */
  '<'(filterVal, rowVal) {
    return rowVal < filterVal
  },

  // less than or equal to
  /**
   * Compare for less than or equal.
   *
   * @param {*} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if row value is less than or equal to filter value.
   */
  '<='(filterVal, rowVal) {
    return rowVal <= filterVal
  },

  // greater than
  /**
   * Compare for greater than.
   *
   * @param {*} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if row value is greater than filter value.
   */
  '>'(filterVal, rowVal) {
    return rowVal > filterVal
  },

  // greater than or equal to
  /**
   * Compare for greater than or equal.
   *
   * @param {*} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if row value is greater than or equal to filter value.
   */
  '>='(filterVal, rowVal) {
    return rowVal >= filterVal
  },

  // not equal to
  /**
   * Compare for inequality.
   *
   * @param {*} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if values are not equal.
   */
  '!='(filterVal, rowVal) {
    return rowVal != filterVal
  },

  /**
   * Test row value against a regex.
   *
   * @param {RegExp|string} filterVal Regex or regex string.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if regex matches row value.
   */
  regex(filterVal, rowVal) {
    if (typeof filterVal === 'string') {
      try {
        filterVal = new RegExp(filterVal)
      } catch (error) {
        console.warn('Filter Error - invalid regex pattern:', filterVal, error)
        return false
      }
    }

    return filterVal.test(rowVal)
  },

  // contains the string
  /**
   * Test whether row value contains filter text.
   *
   * @param {string|null|undefined} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if row value contains filter text.
   */
  like(filterVal, rowVal) {
    if (filterVal == null) {
      return rowVal === filterVal
    }

    if (rowVal != null) {
      return String(rowVal).toLowerCase().includes(filterVal.toLowerCase())
    }

    return false
  },

  // contains the keywords
  /**
   * Test whether row value contains keywords.
   *
   * @param {string} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @param {Object} rowData Row data.
   * @param {{separator?: string, matchAll?: boolean}} filterParams Filter parameters.
   * @returns {boolean} True if keyword match rules are satisfied.
   */
  keywords(filterVal, rowVal, rowData, filterParams) {
    const keywords = filterVal.toLowerCase().split(filterParams.separator ?? ' ')
    const value = String(rowVal ?? '').toLowerCase()
    let matchCount = 0

    keywords.forEach((keyword) => {
      if (value.includes(keyword)) {
        matchCount++
      }
    })

    return filterParams.matchAll ? matchCount === keywords.length : matchCount > 0
  },

  // starts with the string
  /**
   * Test whether row value starts with filter text.
   *
   * @param {string|null|undefined} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if row value starts with filter text.
   */
  starts(filterVal, rowVal) {
    if (filterVal == null) {
      return rowVal === filterVal
    }

    if (rowVal != null) {
      return String(rowVal).toLowerCase().startsWith(filterVal.toLowerCase())
    }

    return false
  },

  // ends with the string
  /**
   * Test whether row value ends with filter text.
   *
   * @param {string|null|undefined} filterVal Filter value.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if row value ends with filter text.
   */
  ends(filterVal, rowVal) {
    if (filterVal == null) {
      return rowVal === filterVal
    }

    if (rowVal != null) {
      return String(rowVal).toLowerCase().endsWith(filterVal.toLowerCase())
    }

    return false
  },

  // in array
  /**
   * Test whether row value exists in an allowed set.
   *
   * @param {Array<*>} filterVal Filter values.
   * @param {*} rowVal Row value.
   * @returns {boolean} True if row value is in filter array.
   */
  in(filterVal, rowVal) {
    if (Array.isArray(filterVal)) {
      return filterVal.length ? filterVal.includes(rowVal) : true
    }

    console.warn('Filter Error - filter value is not an array:', filterVal)
    return false
  }
}
