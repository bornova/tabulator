/**
 * Default column calculation functions.
 *
 * @type {{
 *   avg: function(Array<*>, Array<Object>, Object): string,
 *   max: function(Array<*>, Array<Object>, Object): (string|number),
 *   min: function(Array<*>, Array<Object>, Object): (string|number),
 *   sum: function(Array<*>, Array<Object>, Object): (string|number),
 *   concat: function(Array<*>, Array<Object>, Object): string|number,
 *   count: function(Array<*>, Array<Object>, Object): number,
 *   unique: function(Array<*>, Array<Object>, Object): number
 * }}
 */
export default {
  /**
   * Calculate the average of values.
   *
   * @param {Array<*>} values Values to aggregate.
   * @param {Array<Object>} data Row data.
   * @param {Object} calcParams Calculation parameters.
   * @returns {string} Average value.
   */
  avg(values, data, calcParams) {
    let output = 0
    const precision = typeof calcParams.precision !== 'undefined' ? calcParams.precision : 2

    if (values.length) {
      output = values.reduce((sum, value) => {
        return Number(sum) + Number(value)
      })

      output = output / values.length

      output = precision !== false ? output.toFixed(precision) : output
    }

    return parseFloat(output).toString()
  },
  /**
   * Calculate the maximum value.
   *
   * @param {Array<*>} values Values to aggregate.
   * @param {Array<Object>} data Row data.
   * @param {Object} calcParams Calculation parameters.
   * @returns {string|number} Maximum value.
   */
  max(values, data, calcParams) {
    let output = null
    const precision = typeof calcParams.precision !== 'undefined' ? calcParams.precision : false

    values.forEach((value) => {
      value = Number(value)

      if (value > output || output === null) {
        output = value
      }
    })

    return output !== null ? (precision !== false ? output.toFixed(precision) : output) : ''
  },
  /**
   * Calculate the minimum value.
   *
   * @param {Array<*>} values Values to aggregate.
   * @param {Array<Object>} data Row data.
   * @param {Object} calcParams Calculation parameters.
   * @returns {string|number} Minimum value.
   */
  min(values, data, calcParams) {
    let output = null
    const precision = typeof calcParams.precision !== 'undefined' ? calcParams.precision : false

    values.forEach((value) => {
      value = Number(value)

      if (value < output || output === null) {
        output = value
      }
    })

    return output !== null ? (precision !== false ? output.toFixed(precision) : output) : ''
  },
  /**
   * Calculate the sum of values.
   *
   * @param {Array<*>} values Values to aggregate.
   * @param {Array<Object>} data Row data.
   * @param {Object} calcParams Calculation parameters.
   * @returns {string|number} Summed value.
   */
  sum(values, data, calcParams) {
    let output = 0
    const precision = typeof calcParams.precision !== 'undefined' ? calcParams.precision : false

    if (values.length) {
      values.forEach((value) => {
        value = Number(value)

        output += !Number.isNaN(value) ? Number(value) : 0
      })
    }

    return precision !== false ? output.toFixed(precision) : output
  },
  /**
   * Concatenate values into a single string.
   *
   * @param {Array<*>} values Values to aggregate.
   * @param {Array<Object>} data Row data.
   * @param {Object} calcParams Calculation parameters.
   * @returns {string|number} Concatenated value.
   */
  concat(values, data, calcParams) {
    void data
    void calcParams
    let output = 0

    if (values.length) {
      output = values.reduce((sum, value) => {
        return String(sum) + String(value)
      })
    }

    return output
  },
  /**
   * Count truthy values.
   *
   * @param {Array<*>} values Values to aggregate.
   * @param {Array<Object>} data Row data.
   * @param {Object} calcParams Calculation parameters.
   * @returns {number} Count of truthy values.
   */
  count(values, data, calcParams) {
    void data
    void calcParams
    let output = 0

    if (values.length) {
      values.forEach((value) => {
        if (value) {
          output++
        }
      })
    }

    return output
  },
  /**
   * Count unique values.
   *
   * @param {Array<*>} values Values to aggregate.
   * @param {Array<Object>} data Row data.
   * @param {Object} calcParams Calculation parameters.
   * @returns {number} Number of unique values.
   */
  unique(values, data, calcParams) {
    void data
    void calcParams
    const unique = values.filter((value, index) => {
      return (values || value === 0) && values.indexOf(value) === index
    })

    return unique.length
  }
}
