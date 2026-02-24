import CoreFeature from '../CoreFeature.js'

export default class Alert extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.element = this._createAlertElement()
    this.msgElement = this._createMsgElement()
    this.type = null

    this.element.appendChild(this.msgElement)
  }

  /**
   * Create the root alert container element.
   * @returns {HTMLDivElement}
   */
  _createAlertElement() {
    const el = document.createElement('div')
    el.classList.add('tabulator-alert')
    return el
  }

  /**
   * Create the alert message element.
   * @returns {HTMLDivElement}
   */
  _createMsgElement() {
    const el = document.createElement('div')
    el.classList.add('tabulator-alert-msg')
    el.setAttribute('role', 'alert')
    return el
  }

  /**
   * Build the CSS class name for the current alert type.
   * @returns {string}
   */
  _typeClass() {
    return 'tabulator-alert-state-' + this.type
  }

  /**
   * Show an alert message in the table container.
   * @param {string|HTMLElement|Function} content Message content, element, or content factory.
   * @param {string} [type='msg'] Alert type key.
   */
  alert(content, type = 'msg') {
    if (content) {
      this.clear()

      this.dispatch('alert-show', type)

      this.type = type

      while (this.msgElement.firstChild) this.msgElement.removeChild(this.msgElement.firstChild)

      this.msgElement.classList.add(this._typeClass())

      if (typeof content === 'function') {
        content = content()
      }

      if (content instanceof HTMLElement) {
        this.msgElement.appendChild(content)
      } else {
        this.msgElement.innerHTML = content
      }

      this.table.element.appendChild(this.element)
    }
  }

  /**
   * Hide the alert and remove associated styling.
   */
  clear() {
    this.dispatch('alert-hide', this.type)

    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }

    if (this.type) {
      this.msgElement.classList.remove(this._typeClass())
    }

    this.type = null
  }
}
