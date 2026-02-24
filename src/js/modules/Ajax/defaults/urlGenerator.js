/**
 * Flatten nested values into key/value pairs for query-string generation.
 *
 * @param {*} data Data to flatten.
 * @param {string} [prefix=''] Key prefix.
 * @returns {Array<{key: string|number, value: *}>} Flattened key/value pairs.
 */
function generateParamsList(data, prefix = '') {
  let output = []

  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      output = output.concat(generateParamsList(item, prefix ? `${prefix}[${i}]` : i))
    })
  } else if (data !== null && typeof data === 'object') {
    for (const key in data) {
      output = output.concat(generateParamsList(data[key], prefix ? `${prefix}[${key}]` : key))
    }
  } else {
    output.push({ key: prefix, value: data })
  }

  return output
}

/**
 * Serialize parameter values into a query string.
 *
 * @param {Object} params Request parameters.
 * @returns {string} Encoded query-string.
 */
function serializeParams(params) {
  const output = generateParamsList(params)
  const encoded = []

  output.forEach((item) => {
    encoded.push(`${encodeURIComponent(item.key)}=${encodeURIComponent(item.value)}`)
  })

  return encoded.join('&')
}

/**
 * Default ajax url generator.
 *
 * @param {string} url Request url.
 * @param {RequestInit} config Fetch configuration.
 * @param {Object} params Request parameters.
 * @returns {string} Generated request url.
 */
export default function (url, config, params) {
  if (url) {
    if (params && Object.keys(params).length) {
      if (!config.method || config.method.toLowerCase() === 'get') {
        config.method = 'get'

        url += (url.includes('?') ? '&' : '?') + serializeParams(params)
      }
    }
  }

  return url
}
