import List from '../../List.js'

/**
 * List editor wrapper.
 * @param {object} cell Cell component wrapper.
 * @param {Function} onRendered Render callback registrar.
 * @param {Function} success Success callback.
 * @param {Function} cancel Cancel callback.
 * @param {object} editorParams Editor params.
 * @returns {HTMLInputElement}
 */
export default function (cell, onRendered, success, cancel, editorParams) {
  const list = new List(this, cell, onRendered, success, cancel, editorParams)

  return list.input
}
