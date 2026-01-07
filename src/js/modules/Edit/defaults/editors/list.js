import List from '../../List.js'

export default function (cell, onRendered, success, cancel, editorParams) {
  const list = new List(this, cell, onRendered, success, cancel, editorParams)

  return list.input
}
