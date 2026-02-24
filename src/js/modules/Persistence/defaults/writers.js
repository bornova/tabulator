// write persistence information to storage
/**
 * Default persistence writers.
 *
 * @type {{
 *   local: function(string, string, Object): void,
 *   cookie: function(string, string, Object): void
 * }}
 */
export default {
  /**
   * Write persisted data to localStorage.
   *
   * @param {string} id Persistence identifier.
   * @param {string} type Persistence data type.
   * @param {Object} data Data to persist.
   * @returns {void}
   */
  local(id, type, data) {
    localStorage.setItem(`${id}-${type}`, JSON.stringify(data))
  },
  /**
   * Write persisted data to cookies.
   *
   * @param {string} id Persistence identifier.
   * @param {string} type Persistence data type.
   * @param {Object} data Data to persist.
   * @returns {void}
   */
  cookie(id, type, data) {
    const expireDate = new Date()

    expireDate.setDate(expireDate.getDate() + 10000)

    document.cookie = `${id}-${type}=${JSON.stringify(data)}; expires=${expireDate.toUTCString()}; path=/`
  }
}
