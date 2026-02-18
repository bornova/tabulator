// read persistance information from storage
/**
 * Default persistence readers.
 *
 * @type {{
 *   local: function(string, string): Object|boolean,
 *   cookie: function(string, string): Object|boolean
 * }}
 */
export default {
  /**
   * Read persisted data from localStorage.
   *
   * @param {string} id Persistence identifier.
   * @param {string} type Persistence data type.
   * @returns {Object|boolean} Parsed data or false.
   */
  local(id, type) {
    const data = localStorage.getItem(`${id}-${type}`)

    return data ? JSON.parse(data) : false
  },
  /**
   * Read persisted data from cookies.
   *
   * @param {string} id Persistence identifier.
   * @param {string} type Persistence data type.
   * @returns {Object|boolean} Parsed data or false.
   */
  cookie(id, type) {
    let cookie = document.cookie
    const key = `${id}-${type}`
    const cookiePos = cookie.indexOf(`${key}=`)
    let end
    let data

    // if cookie exists, decode and load column data into tabulator
    if (cookiePos > -1) {
      cookie = cookie.slice(cookiePos)

      end = cookie.indexOf(';')

      if (end > -1) {
        cookie = cookie.slice(0, end)
      }

      data = cookie.replace(`${key}=`, '')
    }

    return data ? JSON.parse(data) : false
  }
}
