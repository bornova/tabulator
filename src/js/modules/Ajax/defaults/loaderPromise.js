/**
 * Default ajax loader that fetches JSON data and resolves with parsed content.
 *
 * @this {Object}
 * @param {string} url Request url.
 * @param {RequestInit} config Fetch configuration.
 * @param {Object} params Request parameters.
 * @returns {Promise<*>} Promise resolving to response data.
 */
export default async function (url, config, params) {
  const method = (config.method || 'GET').toUpperCase()

  // set url
  url = this.urlGenerator.call(this.table, url, config, params)

  // set body content if not GET request
  if (method !== 'GET') {
    const contentType =
      typeof this.table.options.ajaxContentType === 'object'
        ? this.table.options.ajaxContentType
        : this.contentTypeFormatters[this.table.options.ajaxContentType]

    if (contentType) {
      config.headers ??= {}

      for (const key in contentType.headers) {
        if (config.headers[key] === undefined) {
          config.headers[key] = contentType.headers[key]
        }
      }

      config.body = contentType.body.call(this, url, config, params)
    } else {
      console.warn('Ajax Error - Invalid ajaxContentType value:', this.table.options.ajaxContentType)
    }
  }

  if (url) {
    // configure headers
    config.headers ??= {}
    config.headers.Accept ??= 'application/json'
    config.headers['X-Requested-With'] ??= 'XMLHttpRequest'

    config.mode ??= 'cors'

    if (config.mode === 'cors') {
      if (config.headers.Origin === undefined) {
        config.headers.Origin = window.location.origin
      }

      if (config.credentials === undefined) {
        config.credentials = 'same-origin'
      }
    } else {
      if (config.credentials === undefined) {
        config.credentials = 'include'
      }
    }

    // send request
    let response
    try {
      response = await fetch(url, config)
    } catch (error) {
      console.error('Ajax Load Error - Connection Error: ', error)
      throw error
    }

    if (response.ok) {
      try {
        return await response.json()
      } catch (error) {
        console.warn('Ajax Load Error - Invalid JSON returned', error)
        throw error
      }
    } else {
      console.error('Ajax Load Error - Connection Error: ' + response.status, response.statusText)
      throw response
    }
  } else {
    console.warn('Ajax Load Error - No URL Set')
    return []
  }
}
