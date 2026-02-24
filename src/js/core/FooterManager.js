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
   */
  initializeElement() {
    if (this.table.options.footerElement) {
      switch (typeof this.table.options.footerElement) {
        case 'string':
          if (this.table.options.footerElement[0] === '<') {
            this.containerElement.innerHTML = this.table.options.footerElement
          } else {
            const externalContainer = document.querySelector(this.table.options.footerElement)

            if (externalContainer) {
              this.external = true
              this.containerElement = externalContainer
            } else {
              console.warn(
                'Footer Error - Unable to find element matching footerElement selector:',
                this.table.options.footerElement
              )
            }
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
   */
  append(element) {
    this.activate()

    this.containerElement.appendChild(element)
    this.table.rowManager.adjustTableSize()
  }

  /**
   * Prepend content to footer.
   * @param {HTMLElement} element Element to prepend.
   */
  prepend(element) {
    this.activate()

    this.element.insertBefore(element, this.element.firstChild)
    this.table.rowManager.adjustTableSize()
  }

  /**
   * Remove content from footer.
   * @param {HTMLElement} element Element to remove.
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
   */
  redraw() {
    this.dispatch('footer-redraw')
  }
}
