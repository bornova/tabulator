export default class TableRegistry {
  static registry = {
    tables: [],

    /**
     * Register a table instance.
     * @param {TableRegistry} table Table instance.
     * @returns {void}
     */
    register(table) {
      TableRegistry.registry.tables.push(table)
    },

    /**
     * Deregister a table instance.
     * @param {TableRegistry} table Table instance.
     * @returns {void}
     */
    deregister(table) {
      const index = TableRegistry.registry.tables.indexOf(table)

      if (index > -1) {
        TableRegistry.registry.tables.splice(index, 1)
      }
    },

    /**
     * Lookup table instances by selector, element, table instance, or array of queries.
     * @param {string|HTMLElement|TableRegistry|Array<*>} query Lookup query.
     * @param {boolean} [silent] Suppress warnings for invalid selectors.
     * @returns {Array<TableRegistry>}
     */
    lookupTable(query, silent) {
      let results = []
      let matches
      let match

      if (typeof query === 'string') {
        matches = document.querySelectorAll(query)

        if (matches.length) {
          for (let i = 0; i < matches.length; i++) {
            match = TableRegistry.registry.matchElement(matches[i])

            if (match) {
              results.push(match)
            }
          }
        }
      } else if (
        (typeof HTMLElement !== 'undefined' && query instanceof HTMLElement) ||
        query instanceof TableRegistry
      ) {
        match = TableRegistry.registry.matchElement(query)

        if (match) {
          results.push(match)
        }
      } else if (Array.isArray(query)) {
        query.forEach(function (item) {
          results = results.concat(TableRegistry.registry.lookupTable(item, silent))
        })
      } else {
        if (!silent) {
          console.warn('Table Connection Error - Invalid Selector', query)
        }
      }

      return results
    },

    /**
     * Match a DOM element or table instance to a registered table.
     * @param {HTMLElement|TableRegistry} element Lookup target.
     * @returns {TableRegistry|undefined}
     */
    matchElement(element) {
      return TableRegistry.registry.tables.find(function (table) {
        return element instanceof TableRegistry ? table === element : table.element === element
      })
    }
  }

  /**
   * Find matching registered tables.
   * @param {string|HTMLElement|TableRegistry|Array<*>} query Lookup query.
   * @returns {Array<TableRegistry>|boolean}
   */
  static findTable(query) {
    const results = TableRegistry.registry.lookupTable(query, true)
    return Array.isArray(results) && !results.length ? false : results
  }
}
