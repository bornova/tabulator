import { generateParamsList } from './paramsList'

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
