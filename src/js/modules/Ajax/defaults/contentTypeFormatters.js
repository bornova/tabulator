import { generateParamsList } from './paramsList'

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
