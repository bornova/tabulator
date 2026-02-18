export default class ExportRow {
  /**
   * @param {string} type Export row type.
   * @param {Array<object>} columns Export columns.
   * @param {object|boolean} component Source component.
   * @param {number} [indent] Group indent level.
   */
  constructor(type, columns, component, indent) {
    this.type = type
    this.columns = columns
    this.component = component || false
    this.indent = indent || 0
  }
}
