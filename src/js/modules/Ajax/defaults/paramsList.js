/**
 * Flatten nested values into key/value pairs.
 *
 * @param {*} data Data to flatten.
 * @param {string} [prefix=''] Key prefix.
 * @returns {Array<{key: string|number, value: *}>} Flattened key/value pairs.
 */
export function generateParamsList(data, prefix = '') {
  let output = []

  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      output.push(...generateParamsList(item, prefix ? `${prefix}[${i}]` : i))
    })
  } else if (data !== null && typeof data === 'object') {
    for (const key in data) {
      output.push(...generateParamsList(data[key], prefix ? `${prefix}[${key}]` : key))
    }
  } else {
    output.push({ key: prefix, value: data })
  }

  return output
}
