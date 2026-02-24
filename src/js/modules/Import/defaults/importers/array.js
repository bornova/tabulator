/**
 * Default array importer.
 *
 * @param {Array<Object>} input Input row data.
 * @returns {Array<Object>} Imported row data.
 */
export default function (input) {
  return Array.isArray(input) ? input.slice() : []
}
