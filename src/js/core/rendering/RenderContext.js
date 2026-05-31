export default class RenderContext {
  /**
   * @param {object} table Tabulator table instance.
   * @param {HTMLElement} element Container element.
   * @param {HTMLElement} tableElement Inner table element.
   */
  constructor(table, element, tableElement) {
    this.table = table
    this.element = element
    this.tableElement = tableElement
  }
}
