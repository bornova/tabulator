/**
 * Adaptively resolve and render an editor based on cell value type.
 * @param {object} cell Cell component wrapper.
 * @param {Function} onRendered Render callback registrar.
 * @param {Function} success Success callback.
 * @param {Function} cancel Cancel callback.
 * @param {object} params Editor params.
 * @returns {HTMLElement}
 */
export default function (cell, onRendered, success, cancel, params) {
  const column = cell._getSelf().column

  const defaultLookup = (cell) => {
    const value = cell.getValue()

    let editor = 'input'

    switch (typeof value) {
      case 'number':
        editor = 'number'
        break

      case 'boolean':
        editor = 'tickCross'
        break

      case 'string':
        if (value.includes('\n')) {
          editor = 'textarea'
        }
        break
    }

    return editor
  }

  const lookup = params.editorLookup ? params.editorLookup(cell) : defaultLookup(cell)

  const editorParams = params.paramsLookup
    ? typeof params.paramsLookup === 'function'
      ? params.paramsLookup(lookup, cell)
      : params.paramsLookup[lookup]
    : undefined

  const editorFunc = this.table.modules.edit.lookupEditor(lookup, column)
  const fallbackEditorFunc = this.table.modules.edit.lookupEditor('input', column)

  if (typeof editorFunc !== 'function') {
    console.warn('Adaptable Editor Error - Unable to resolve editor, falling back to input:', lookup)
    return fallbackEditorFunc.call(this, cell, onRendered, success, cancel, editorParams || {})
  }

  return editorFunc.call(this, cell, onRendered, success, cancel, editorParams || {})
}
