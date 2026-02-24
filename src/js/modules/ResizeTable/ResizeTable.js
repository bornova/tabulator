import Module from '../../core/Module.js'

export default class ResizeTable extends Module {
  static moduleName = 'resizeTable'

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.binding = false
    this.visibilityObserver = false
    this.resizeObserver = false
    this.containerObserver = false

    this.tableHeight = 0
    this.tableWidth = 0
    this.containerHeight = 0
    this.containerWidth = 0

    this.autoResize = false

    this.visible = false

    this.initialized = false
    this.initialRedraw = false

    this.registerTableOption('autoResize', true) // auto resize table
  }

  /**
   * Initialize resize and visibility observers.
   */
  initialize() {
    if (this.table.options.autoResize) {
      const table = this.table
      const canResize = () =>
        !table.browserMobile ||
        (table.browserMobile && (!table.modules.edit || (table.modules.edit && !table.modules.edit.currentCell)))
      let tableStyle

      this.tableHeight = table.element.clientHeight
      this.tableWidth = table.element.clientWidth

      if (table.element.parentNode) {
        this.containerHeight = table.element.parentNode.clientHeight
        this.containerWidth = table.element.parentNode.clientWidth
      }

      if (
        typeof IntersectionObserver !== 'undefined' &&
        typeof ResizeObserver !== 'undefined' &&
        table.rowManager.getRenderMode() === 'virtual'
      ) {
        this.initializeVisibilityObserver()

        this.autoResize = true

        this.resizeObserver = new ResizeObserver((entry) => {
          if (canResize()) {
            const nodeHeight = Math.floor(entry[0].contentRect.height)
            const nodeWidth = Math.floor(entry[0].contentRect.width)

            if (this.tableHeight !== nodeHeight || this.tableWidth !== nodeWidth) {
              this.tableHeight = nodeHeight
              this.tableWidth = nodeWidth

              if (table.element.parentNode) {
                this.containerHeight = table.element.parentNode.clientHeight
                this.containerWidth = table.element.parentNode.clientWidth
              }

              this.redrawTable()
            }
          }
        })

        this.resizeObserver.observe(table.element)

        tableStyle = window.getComputedStyle(table.element)

        if (
          this.table.element.parentNode &&
          !this.table.rowManager.fixedHeight &&
          (tableStyle.getPropertyValue('max-height') || tableStyle.getPropertyValue('min-height'))
        ) {
          this.containerObserver = new ResizeObserver((entry) => {
            if (canResize()) {
              const nodeHeight = Math.floor(entry[0].contentRect.height)
              const nodeWidth = Math.floor(entry[0].contentRect.width)

              if (this.containerHeight !== nodeHeight || this.containerWidth !== nodeWidth) {
                this.containerHeight = nodeHeight
                this.containerWidth = nodeWidth
                this.tableHeight = table.element.clientHeight
                this.tableWidth = table.element.clientWidth
              }

              this.redrawTable()
            }
          })

          this.containerObserver.observe(this.table.element.parentNode)
        }

        this.subscribe('table-resize', this.tableResized.bind(this))
      } else {
        this.binding = () => {
          if (canResize()) {
            table.columnManager.rerenderColumns(true)
            table.redraw()
          }
        }

        window.addEventListener('resize', this.binding)
      }

      this.subscribe('table-destroy', this.clearBindings.bind(this))
    }
  }

  /**
   * Initialize table visibility observer.
   */
  initializeVisibilityObserver() {
    this.visibilityObserver = new IntersectionObserver((entries) => {
      this.visible = entries[entries.length - 1].isIntersecting

      if (!this.initialized) {
        this.initialized = true
        this.initialRedraw = !this.visible
      } else {
        if (this.visible) {
          this.redrawTable(this.initialRedraw)
          this.initialRedraw = false
        }
      }
    })

    this.visibilityObserver.observe(this.table.element)
  }

  /**
   * Trigger table redraw after resize changes.
   * @param {boolean} [force] Force redraw.
   */
  redrawTable(force) {
    if (this.initialized && this.visible) {
      this.table.columnManager.rerenderColumns(true)
      this.table.redraw(force)
    }
  }

  /**
   * Handle table-resize event by redrawing rows.
   */
  tableResized() {
    this.table.rowManager.redraw()
  }

  /**
   * Clear bound listeners and observers.
   */
  clearBindings() {
    const tableElement = this.table.element

    if (this.binding) {
      window.removeEventListener('resize', this.binding)
    }

    if (this.resizeObserver) {
      this.resizeObserver.unobserve(tableElement)
    }

    if (this.visibilityObserver) {
      this.visibilityObserver.unobserve(tableElement)
    }

    if (this.containerObserver && tableElement.parentNode) {
      this.containerObserver.unobserve(tableElement.parentNode)
    }

    this.resizeObserver = false
    this.visibilityObserver = false
    this.containerObserver = false
  }
}
