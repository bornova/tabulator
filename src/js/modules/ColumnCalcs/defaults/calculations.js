export default {
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
  concat(values, data, calcParams) {
    let output = 0

    if (values.length) {
      output = values.reduce((sum, value) => {
        return String(sum) + String(value)
      })
    }

    return output
  },
  count(values, data, calcParams) {
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
  unique(values, data, calcParams) {
    const unique = values.filter((value, index) => {
      return (values || value === 0) && values.indexOf(value) === index
    })

    return unique.length
  }
}
