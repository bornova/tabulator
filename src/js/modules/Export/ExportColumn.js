export default class ExportColumn {
  /**
   * @param {*} value Exported cell/header value.
   * @param {object|boolean} component Source component.
   * @param {number} width Column span width.
   * @param {number} height Row span height.
   * @param {number} depth Header depth.
   */
  constructor(value, component, width, height, depth) {
    this.value = value
    this.component = component ?? false
    this.width = width
    this.height = height
    this.depth = depth
  }
}
