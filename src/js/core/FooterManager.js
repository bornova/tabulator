import CoreFeature from './CoreFeature.js'

export default class FooterManager extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.active = false
    this.element = this.createElement() // containing element
    this.containerElement = this.createContainerElement() // containing element
    this.external = false
  }

  /**
   * Initialize footer element state.
   * @returns {void}
   */
  initialize() {
    this.initializeElement()
  }

  /**
   * Create footer root element.
   * @returns {HTMLDivElement}
   */
  createElement() {
    const element = document.createElement('div')

    element.classList.add('tabulator-footer')

    return element
  }

  /**
   * Create footer content container.
   * @returns {HTMLDivElement}
   */
  createContainerElement() {
    const element = document.createElement('div')

    element.classList.add('tabulator-footer-contents')

    this.element.appendChild(element)

    return element
  }

  /**
   * Initialize footer from configured external/inline element.
   * @returns {void}
   */
  initializeElement() {
    if (this.table.options.footerElement) {
      switch (typeof this.table.options.footerElement) {
        case 'string':
          if (this.table.options.footerElement[0] === '<') {
            this.containerElement.innerHTML = this.table.options.footerElement
          } else {
            this.external = true
            this.containerElement = document.querySelector(this.table.options.footerElement)
          }
          break

        default:
          this.element = this.table.options.footerElement
          break
      }
    }
  }

  /**
   * Get footer root element.
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element
  }

  /**
   * Append content to footer.
   * @param {HTMLElement} element Element to append.
   * @returns {void}
   */
  append(element) {
    this.activate()

    this.containerElement.appendChild(element)
    this.table.rowManager.adjustTableSize()
  }

  /**
   * Prepend content to footer.
   * @param {HTMLElement} element Element to prepend.
   * @returns {void}
   */
  prepend(element) {
    this.activate()

    this.element.insertBefore(element, this.element.firstChild)
    this.table.rowManager.adjustTableSize()
  }

  /**
   * Remove content from footer.
   * @param {HTMLElement} element Element to remove.
   * @returns {void}
   */
  remove(element) {
    if (element.parentNode) {
      element.parentNode.removeChild(element)
    }

    this.deactivate()
  }

  /**
   * Deactivate footer if empty or forced.
   * @param {boolean} [force] Force deactivation.
   * @returns {void}
   */
  deactivate(force) {
    if (!this.element.firstChild || force) {
      if (!this.external) {
        if (this.element.parentNode) {
          this.element.parentNode.removeChild(this.element)
        }
      }
      this.active = false
    }
  }

  /**
   * Activate footer rendering.
   * @returns {void}
   */
  activate() {
    if (!this.active) {
      this.active = true
      if (!this.external) {
        this.table.element.appendChild(this.getElement())
        this.table.element.style.display = ''
      }
    }
  }

  /**
   * Dispatch footer redraw event.
   * @returns {void}
   */
  redraw() {
    this.dispatch('footer-redraw')
  }
}
