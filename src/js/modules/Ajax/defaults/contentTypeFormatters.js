/**
 * Flatten nested values into key/value pairs for request payload generation.
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
 * Default ajax content-type formatters.
 *
 * @type {{
 *   json: {headers: Object, body: function(string, RequestInit, Object): string},
 *   form: {headers: Object, body: function(string, RequestInit, Object): FormData}
 * }}
 */
export default {
  json: {
    headers: {
      'Content-Type': 'application/json'
    },
    /**
     * Build a JSON payload.
     *
     * @param {string} url Request url.
     * @param {RequestInit} config Fetch configuration.
     * @param {Object} params Request parameters.
     * @returns {string} JSON-encoded request body.
     */
    body(url, config, params) {
      return JSON.stringify(params)
    }
  },
  form: {
    headers: {},
    /**
     * Build a FormData payload.
     *
     * @param {string} url Request url.
     * @param {RequestInit} config Fetch configuration.
     * @param {Object} params Request parameters.
     * @returns {FormData} FormData request body.
     */
    body(url, config, params) {
      const output = generateParamsList(params)
      const form = new FormData()

      output.forEach((item) => {
        form.append(item.key, item.value)
      })

      return form
    }
  }
}
