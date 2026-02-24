import Module from '../../core/Module.js'

import defaultPageCounters from './defaults/pageCounters.js'

export default class Page extends Module {
  static moduleName = 'page'

  // load defaults
  static pageCounters = defaultPageCounters

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.mode = 'local'
    this.progressiveLoad = false

    this.element = null
    this.pageCounterElement = null
    this.pageCounter = null

    this.size = 0
    this.page = 1
    this.count = 5
    this.max = 1

    this.remoteRowCountEstimate = null

    this.initialLoad = true
    this.dataChanging = false // flag to check if data is being changed by this module

    this.pageSizes = []

    this.registerTableOption('pagination', false) // set pagination type
    this.registerTableOption('paginationMode', 'local') // local or remote pagination
    this.registerTableOption('paginationSize', false) // set number of rows to a page
    this.registerTableOption('paginationInitialPage', 1) // initial page to show on load
    this.registerTableOption('paginationCounter', false) // set pagination counter
    this.registerTableOption('paginationCounterElement', false) // set pagination counter
    this.registerTableOption('paginationButtonCount', 5) // set count of page button
    this.registerTableOption('paginationSizeSelector', false) // add pagination size selector element
    this.registerTableOption('paginationElement', false) // element to hold pagination numbers
    // this.registerTableOption("paginationDataSent", {}); //pagination data sent to the server
    // this.registerTableOption("paginationDataReceived", {}); //pagination data received from the server
    this.registerTableOption('paginationAddRow', 'page') // add rows on table or page
    this.registerTableOption('paginationOutOfRange', false) // reset the current page when the last page < this.page, values: false|function|any value accepted by setPage()

    this.registerTableOption('progressiveLoad', false) // progressive loading
    this.registerTableOption('progressiveLoadDelay', 0) // delay between requests
    this.registerTableOption('progressiveLoadScrollMargin', 0) // margin before scroll begins

    this.registerTableFunction('setMaxPage', this.setMaxPage.bind(this))
    this.registerTableFunction('setPage', this.setPage.bind(this))
    this.registerTableFunction('setPageToRow', this.userSetPageToRow.bind(this))
    this.registerTableFunction('setPageSize', this.userSetPageSize.bind(this))
    this.registerTableFunction('getPageSize', this.getPageSize.bind(this))
    this.registerTableFunction('previousPage', this.previousPage.bind(this))
    this.registerTableFunction('nextPage', this.nextPage.bind(this))
    this.registerTableFunction('getPage', this.getPage.bind(this))
    this.registerTableFunction('getPageMax', this.getPageMax.bind(this))

    // register component functions
    this.registerComponentFunction('row', 'pageTo', this.setPageToRow.bind(this))
  }

  /**
   * Dispatch page error to internal/external listeners and console.
   * @param {string} message Error message.
   * @param {...*} details Extra detail values.
   * @returns {void}
   */
  logPageError(message, ...details) {
    const error = { message, details }

    this.dispatch('page-error', error)
    this.dispatchExternal('pageError', error)

    console.error(message, ...details)
  }

  /**
   * Dispatch page warning to internal/external listeners and console.
   * @param {string} message Warning message.
   * @param {...*} details Extra detail values.
   * @returns {void}
   */
  logPageWarning(message, ...details) {
    const warning = { message, details }

    this.dispatch('page-warning', warning)
    this.dispatchExternal('pageWarning', warning)

    console.warn(message, ...details)
  }

  /**
   * Initialize pagination/progressive-load subscriptions and UI.
   * @returns {void}
   */
  initialize() {
    if (this.table.options.pagination) {
      this.subscribe('row-deleted', this.rowsUpdated.bind(this))
      this.subscribe('row-added', this.rowsUpdated.bind(this))
      this.subscribe('data-processed', this.initialLoadComplete.bind(this))
      this.subscribe('table-built', this.calculatePageSizes.bind(this))
      this.subscribe('footer-redraw', this.footerRedraw.bind(this))

      if (this.table.options.paginationAddRow === 'page') {
        this.subscribe('row-adding-position', this.rowAddingPosition.bind(this))
      }

      if (this.table.options.paginationMode === 'remote') {
        this.subscribe('data-params', this.remotePageParams.bind(this))
        this.subscribe('data-loaded', this._parseRemoteData.bind(this))
      }

      if (this.table.options.progressiveLoad) {
        this.logPageError('Progressive Load Error - Pagination and progressive load cannot be used at the same time')
      }

      this.registerDisplayHandler(this.restOnRenderBefore.bind(this), 40)
      this.registerDisplayHandler(this.getRows.bind(this), 50)

      this.createElements()
      this.initializePageCounter()
      this.initializePaginator()
    } else if (this.table.options.progressiveLoad) {
      this.subscribe('data-params', this.remotePageParams.bind(this))
      this.subscribe('data-loaded', this._parseRemoteData.bind(this))
      this.subscribe('table-built', this.calculatePageSizes.bind(this))
      this.subscribe('data-processed', this.initialLoadComplete.bind(this))

      this.initializeProgressive(this.table.options.progressiveLoad)

      if (this.table.options.progressiveLoad === 'scroll') {
        this.subscribe('scroll-vertical', this.scrollVertical.bind(this))
      }
    }
  }

  /**
   * Resolve insertion anchor for add-row when paginated.
   * @param {object} row Internal row.
   * @param {boolean} top Insert at top flag.
   * @returns {{index:object|undefined,top:boolean}}
   */
  rowAddingPosition(row, top) {
    const rowManager = this.table.rowManager
    const displayRows = rowManager.getDisplayRows()
    let index

    if (top) {
      if (displayRows.length) {
        index = displayRows[0]
      } else {
        if (rowManager.activeRows.length) {
          index = rowManager.activeRows[rowManager.activeRows.length - 1]
          top = false
        }
      }
    } else {
      if (displayRows.length) {
        index = displayRows[displayRows.length - 1]
        top = !(displayRows.length < this.size)
      }
    }

    return { index, top }
  }

  /**
   * Calculate pagination size from option or viewport.
   * @returns {void}
   */
  calculatePageSizes() {
    let testElRow, testElCell

    if (this.table.options.paginationSize) {
      this.size = this.table.options.paginationSize
    } else {
      testElRow = document.createElement('div')
      testElRow.classList.add('tabulator-row')
      testElRow.style.visibility = 'hidden'

      testElCell = document.createElement('div')
      testElCell.classList.add('tabulator-cell')
      testElCell.innerHTML = 'Page Row Test'

      testElRow.appendChild(testElCell)

      this.table.rowManager.getTableElement().appendChild(testElRow)

      this.size = Math.floor(this.table.rowManager.getElement().clientHeight / testElRow.offsetHeight)

      this.table.rowManager.getTableElement().removeChild(testElRow)
    }

    this.dispatchExternal('pageSizeChanged', this.size)

    this.generatePageSizeSelectList()
  }

  /**
   * Mark initial data load as complete.
   * @returns {void}
   */
  initialLoadComplete() {
    this.initialLoad = false
  }

  /**
   * Inject pagination params into remote data requests.
   * @param {*} data Data source descriptor.
   * @param {object} config Request config.
   * @param {boolean} silent Silent flag.
   * @param {object} params Request params.
   * @returns {object}
   */
  remotePageParams(data, config, silent, params) {
    if (!this.initialLoad) {
      if ((this.progressiveLoad && !silent) || (!this.progressiveLoad && !this.dataChanging)) {
        this.reset(true)
      }
    }

    // configure request params
    params.page = this.page

    // set page size if defined
    if (this.size) {
      params.size = this.size
    }

    return params
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////

  /**
   * User-facing set-page-to-row helper.
   * @param {*} row Row lookup.
   * @returns {Promise<void>}
   */
  userSetPageToRow(row) {
    if (this.table.options.pagination) {
      row = this.table.rowManager.findRow(row)

      if (row) {
        return this.setPageToRow(row)
      }
    }

    return Promise.reject()
  }

  /**
   * User-facing page-size setter.
   * @param {number|boolean} size Page size.
   * @returns {Promise<void>|boolean}
   */
  userSetPageSize(size) {
    if (this.table.options.pagination) {
      this.setPageSize(size)
      return this.setPage(1)
    } else {
      return false
    }
  }
  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Trigger next page while progressive scroll nears bottom.
   * @param {number} top Scroll top.
   * @param {boolean} dir Scroll direction.
   * @returns {void}
   */
  scrollVertical(top, dir) {
    let element, diff, margin
    if (!dir && !this.table.dataLoader.loading) {
      element = this.table.rowManager.getElement()
      diff = element.scrollHeight - element.clientHeight - top
      margin = this.table.options.progressiveLoadScrollMargin || element.clientHeight * 2

      if (diff < margin) {
        this.nextPage().catch(() => {}) // consume the exception thrown when on the last page
      }
    }
  }

  /**
   * Reset page before render in local pagination mode.
   * @param {Array<object>} rows Display rows.
   * @param {boolean} renderInPosition Render-in-position flag.
   * @returns {Array<object>}
   */
  restOnRenderBefore(rows, renderInPosition) {
    if (!renderInPosition) {
      if (this.mode === 'local') {
        this.reset()
      }
    }

    return rows
  }

  /**
   * Refresh data after row count changes.
   * @returns {void}
   */
  rowsUpdated() {
    this.refreshData(true, 'all')
  }

  /**
   * Create paginator DOM elements.
   * @returns {void}
   */
  createElements() {
    let button

    this.element = document.createElement('span')
    this.element.classList.add('tabulator-paginator')

    this.pagesElement = document.createElement('span')
    this.pagesElement.classList.add('tabulator-pages')

    button = document.createElement('button')
    button.classList.add('tabulator-page')
    button.setAttribute('type', 'button')
    button.setAttribute('role', 'button')
    button.setAttribute('aria-label', '')
    button.setAttribute('title', '')

    this.firstBut = button.cloneNode(true)
    this.firstBut.setAttribute('data-page', 'first')

    this.prevBut = button.cloneNode(true)
    this.prevBut.setAttribute('data-page', 'prev')

    this.nextBut = button.cloneNode(true)
    this.nextBut.setAttribute('data-page', 'next')

    this.lastBut = button.cloneNode(true)
    this.lastBut.setAttribute('data-page', 'last')

    if (this.table.options.paginationSizeSelector) {
      this.pageSizeSelect = document.createElement('select')
      this.pageSizeSelect.classList.add('tabulator-page-size')
    }
  }

  /**
   * Regenerate page-size selector options.
   * @returns {void}
   */
  generatePageSizeSelectList() {
    let pageSizes

    if (this.pageSizeSelect) {
      if (Array.isArray(this.table.options.paginationSizeSelector)) {
        pageSizes = this.table.options.paginationSizeSelector.slice()
        this.pageSizes = pageSizes

        if (this.pageSizes.indexOf(this.size) === -1) {
          pageSizes.unshift(this.size)
        }
      } else {
        if (this.pageSizes.indexOf(this.size) === -1) {
          pageSizes = []

          for (let i = 1; i < 5; i++) {
            pageSizes.push(this.size * i)
          }

          this.pageSizes = pageSizes
        } else {
          pageSizes = this.pageSizes
        }
      }

      while (this.pageSizeSelect.firstChild) this.pageSizeSelect.removeChild(this.pageSizeSelect.firstChild)

      pageSizes.forEach((item) => {
        const itemEl = document.createElement('option')
        itemEl.value = item

        if (item === true) {
          this.langBind('pagination|all', function (value) {
            itemEl.innerHTML = value
          })
        } else {
          itemEl.innerHTML = item
        }

        this.pageSizeSelect.appendChild(itemEl)
      })

      this.pageSizeSelect.value = this.size
    }
  }

  /**
   * Initialize configured page counter element.
   * @returns {void}
   */
  initializePageCounter() {
    const counter = this.table.options.paginationCounter
    let pageCounter

    if (counter) {
      if (typeof counter === 'function') {
        pageCounter = counter
      } else {
        pageCounter = Page.pageCounters[counter]
      }

      if (pageCounter) {
        this.pageCounter = pageCounter

        this.pageCounterElement = document.createElement('span')
        this.pageCounterElement.classList.add('tabulator-page-counter')
      } else {
        this.logPageWarning('Pagination Error - No such page counter found: ', counter)
      }
    }
  }

  // setup pagination
  /**
   * Initialize paginator controls and bindings.
   * @param {boolean} [hidden] Build in hidden mode for progressive loading.
   * @returns {void}
   */
  initializePaginator(hidden) {
    let pageSelectLabel, paginationCounterHolder

    if (!hidden) {
      // build pagination element

      // bind localizations
      this.langBind('pagination|first', (value) => {
        this.firstBut.innerHTML = value
      })

      this.langBind('pagination|first_title', (value) => {
        this.firstBut.setAttribute('aria-label', value)
        this.firstBut.setAttribute('title', value)
      })

      this.langBind('pagination|prev', (value) => {
        this.prevBut.innerHTML = value
      })

      this.langBind('pagination|prev_title', (value) => {
        this.prevBut.setAttribute('aria-label', value)
        this.prevBut.setAttribute('title', value)
      })

      this.langBind('pagination|next', (value) => {
        this.nextBut.innerHTML = value
      })

      this.langBind('pagination|next_title', (value) => {
        this.nextBut.setAttribute('aria-label', value)
        this.nextBut.setAttribute('title', value)
      })

      this.langBind('pagination|last', (value) => {
        this.lastBut.innerHTML = value
      })

      this.langBind('pagination|last_title', (value) => {
        this.lastBut.setAttribute('aria-label', value)
        this.lastBut.setAttribute('title', value)
      })

      // click bindings
      this.firstBut.addEventListener('click', () => {
        this.setPage(1)
      })

      this.prevBut.addEventListener('click', () => {
        this.previousPage()
      })

      this.nextBut.addEventListener('click', () => {
        this.nextPage()
      })

      this.lastBut.addEventListener('click', () => {
        this.setPage(this.max)
      })

      if (this.table.options.paginationElement) {
        this.element = this.table.options.paginationElement
      }

      if (this.pageSizeSelect) {
        pageSelectLabel = document.createElement('label')

        this.langBind('pagination|page_size', (value) => {
          this.pageSizeSelect.setAttribute('aria-label', value)
          this.pageSizeSelect.setAttribute('title', value)
          pageSelectLabel.innerHTML = value
        })

        this.element.appendChild(pageSelectLabel)
        this.element.appendChild(this.pageSizeSelect)

        this.pageSizeSelect.addEventListener('change', () => {
          this.setPageSize(this.pageSizeSelect.value === 'true' ? true : this.pageSizeSelect.value)
          this.setPage(1)
        })
      }

      // append to DOM
      this.element.appendChild(this.firstBut)
      this.element.appendChild(this.prevBut)
      this.element.appendChild(this.pagesElement)
      this.element.appendChild(this.nextBut)
      this.element.appendChild(this.lastBut)

      if (!this.table.options.paginationElement) {
        if (this.table.options.paginationCounter) {
          if (this.table.options.paginationCounterElement) {
            if (this.table.options.paginationCounterElement instanceof HTMLElement) {
              this.table.options.paginationCounterElement.appendChild(this.pageCounterElement)
            } else if (typeof this.table.options.paginationCounterElement === 'string') {
              paginationCounterHolder = document.querySelector(this.table.options.paginationCounterElement)

              if (paginationCounterHolder) {
                paginationCounterHolder.appendChild(this.pageCounterElement)
              } else {
                this.logPageWarning(
                  'Pagination Error - Unable to find element matching paginationCounterElement selector:',
                  this.table.options.paginationCounterElement
                )
              }
            }
          } else {
            this.footerAppend(this.pageCounterElement)
          }
        }

        this.footerAppend(this.element)
      }

      this.page = this.table.options.paginationInitialPage
      this.count = this.table.options.paginationButtonCount
    }

    // set default values
    this.mode = this.table.options.paginationMode
  }

  /**
   * Initialize progressive load mode.
   * @param {string} mode Progressive mode key.
   * @returns {void}
   */
  initializeProgressive(mode) {
    this.initializePaginator(true)
    this.mode = 'progressive_' + mode
    this.progressiveLoad = true
  }

  /**
   * Dispatch page-changed internal event.
   * @returns {void}
   */
  trackChanges() {
    this.dispatch('page-changed')
  }

  // calculate maximum page from number of rows
  /**
   * Calculate max page from row count.
   * @param {number} rowCount Row count.
   * @returns {void}
   */
  setMaxRows(rowCount) {
    if (!rowCount) {
      this.max = 1
    } else {
      this.max = this.size === true ? 1 : Math.ceil(rowCount / this.size)
    }

    if (this.page > this.max) {
      this.page = this.max
    }
  }

  // reset to first page without triggering action
  /**
   * Reset to first page without triggering action when applicable.
   * @param {boolean} [force] Force reset in non-local mode.
   * @returns {void}
   */
  reset(force) {
    if (!this.initialLoad) {
      if (this.mode === 'local' || force) {
        this.page = 1
        this.trackChanges()
      }
    }
  }

  // set the maximum page
  /**
   * Set maximum page number.
   * @param {number|string} max Maximum page.
   * @returns {void}
   */
  setMaxPage(max) {
    max = parseInt(max, 10)

    this.max = max || 1

    if (this.page > this.max) {
      this.page = this.max
      this.trigger()
    }
  }

  // set current page number
  /**
   * Set current page and trigger page load.
   * @param {number|string} page Page number or keyword.
   * @returns {Promise<void>}
   */
  setPage(page) {
    switch (page) {
      case 'first':
        return this.setPage(1)

      case 'prev':
        return this.previousPage()

      case 'next':
        return this.nextPage()

      case 'last':
        return this.setPage(this.max)
    }

    page = parseInt(page, 10)

    if ((page > 0 && page <= this.max) || this.mode !== 'local') {
      this.page = page

      this.trackChanges()

      return this.trigger()
    } else {
      this.logPageWarning(`Pagination Error - Requested page is out of range of 1 - ${this.max}:`, page)
      return Promise.reject()
    }
  }

  /**
   * Navigate to page containing a specific row.
   * @param {object} row Internal row.
   * @returns {Promise<void>}
   */
  setPageToRow(row) {
    const rows = this.displayRows(-1)
    const index = rows.indexOf(row)

    if (index > -1) {
      const page = this.size === true ? 1 : Math.ceil((index + 1) / this.size)

      return this.setPage(page)
    } else {
      this.logPageWarning('Pagination Error - Requested row is not visible')
      return Promise.reject()
    }
  }

  /**
   * Set active page size.
   * @param {number|boolean|string} size Page size.
   * @returns {void}
   */
  setPageSize(size) {
    if (size !== true) {
      size = parseInt(size, 10)
    }

    if (size > 0) {
      this.size = size
      this.dispatchExternal('pageSizeChanged', size)
    }

    if (this.pageSizeSelect) {
      // this.pageSizeSelect.value = size;
      this.generatePageSizeSelectList()
    }

    this.trackChanges()
  }

  /**
   * Render pagination counter content.
   * @param {number} totalRows Total rows.
   * @param {number} size Page size.
   * @param {number} currentRow Current row index.
   * @returns {void}
   */
  _setPageCounter(totalRows, size, currentRow) {
    let content

    if (this.pageCounter) {
      if (this.mode === 'remote') {
        size = this.size
        currentRow = (this.page - 1) * this.size + 1
        totalRows = this.remoteRowCountEstimate
      }

      content = this.pageCounter.call(this, size, currentRow, this.page, totalRows, this.max)

      switch (typeof content) {
        case 'object':
          if (content instanceof Node) {
            // clear previous cell contents
            while (this.pageCounterElement.firstChild) {
              this.pageCounterElement.removeChild(this.pageCounterElement.firstChild)
            }

            this.pageCounterElement.appendChild(content)
          } else {
            this.pageCounterElement.innerHTML = ''

            if (content != null) {
              this.logPageWarning(
                'Page Counter Error - Page Counter has returned a type of object, the only valid page counter object return is an instance of Node, the page counter returned:',
                content
              )
            }
          }
          break
        case 'undefined':
          this.pageCounterElement.innerHTML = ''
          break
        default:
          this.pageCounterElement.innerHTML = content
      }
    }
  }

  // setup the pagination buttons
  /**
   * Build visible page buttons and navigation state.
   * @returns {void}
   */
  _setPageButtons() {
    const leftSize = Math.floor((this.count - 1) / 2)
    const rightSize = Math.ceil((this.count - 1) / 2)
    const min =
      this.max - this.page + leftSize + 1 < this.count ? this.max - this.count + 1 : Math.max(this.page - leftSize, 1)
    const max = this.page <= rightSize ? Math.min(this.count, this.max) : Math.min(this.page + rightSize, this.max)

    while (this.pagesElement.firstChild) this.pagesElement.removeChild(this.pagesElement.firstChild)

    if (this.page == 1) {
      this.firstBut.disabled = true
      this.prevBut.disabled = true
    } else {
      this.firstBut.disabled = false
      this.prevBut.disabled = false
    }

    if (this.page === this.max) {
      this.lastBut.disabled = true
      this.nextBut.disabled = true
    } else {
      this.lastBut.disabled = false
      this.nextBut.disabled = false
    }

    for (let i = min; i <= max; i++) {
      if (i > 0 && i <= this.max) {
        this.pagesElement.appendChild(this._generatePageButton(i))
      }
    }

    this.footerRedraw()
  }

  /**
   * Create a single page button element.
   * @param {number} page Page number.
   * @returns {HTMLButtonElement}
   */
  _generatePageButton(page) {
    const button = document.createElement('button')

    button.classList.add('tabulator-page')
    if (page === this.page) {
      button.classList.add('active')
    }

    button.setAttribute('type', 'button')
    button.setAttribute('role', 'button')

    this.langBind('pagination|page_title', (value) => {
      button.setAttribute('aria-label', `${value} ${page}`)
      button.setAttribute('title', `${value} ${page}`)
    })

    button.setAttribute('data-page', page)
    button.textContent = page

    button.addEventListener('click', () => {
      this.setPage(page)
    })

    return button
  }

  // previous page
  /**
   * Navigate to previous page.
   * @returns {Promise<void>}
   */
  previousPage() {
    if (this.page > 1) {
      this.page--

      this.trackChanges()

      return this.trigger()
    } else {
      this.logPageWarning('Pagination Error - Previous page would be less than page 1:', 0)
      return Promise.reject()
    }
  }

  // next page
  /**
   * Navigate to next page.
   * @returns {Promise<void>}
   */
  nextPage() {
    if (this.page < this.max) {
      this.page++

      this.trackChanges()

      return this.trigger()
    } else {
      if (!this.progressiveLoad) {
        this.logPageWarning(
          'Pagination Error - Next page would be greater than maximum page of ' + this.max + ':',
          this.max + 1
        )
      }
      return Promise.reject()
    }
  }

  // return current page number
  /**
   * Get current page number.
   * @returns {number}
   */
  getPage() {
    return this.page
  }

  // return max page number
  /**
   * Get maximum available page number.
   * @returns {number}
   */
  getPageMax() {
    return this.max
  }

  /**
   * Get current page size.
   * @returns {number|boolean}
   */
  getPageSize() {
    return this.size
  }

  /**
   * Get active pagination mode.
   * @returns {string}
   */
  getMode() {
    return this.mode
  }

  // return appropriate rows for current page
  /**
   * Return rows for current page context.
   * @param {Array<object>} data Input row set.
   * @returns {Array<object>}
   */
  getRows(data) {
    let actualRowPageSize = 0
    let output
    let start
    let end
    let actualStartRow

    const actualRows = data.filter((row) => {
      return row.type === 'row'
    })

    if (this.mode === 'local') {
      output = []

      this.setMaxRows(data.length)

      if (this.size === true) {
        start = 0
        end = data.length
      } else {
        start = this.size * (this.page - 1)
        end = start + parseInt(this.size, 10)
      }

      this._setPageButtons()

      for (let i = start; i < end; i++) {
        const row = data[i]

        if (row) {
          output.push(row)

          if (row.type === 'row') {
            if (!actualStartRow) {
              actualStartRow = row
            }

            actualRowPageSize++
          }
        }
      }

      this._setPageCounter(
        actualRows.length,
        actualRowPageSize,
        actualStartRow ? actualRows.indexOf(actualStartRow) + 1 : 0
      )

      return output
    } else {
      this._setPageButtons()
      this._setPageCounter(actualRows.length)

      return data.slice(0)
    }
  }

  /**
   * Trigger data load/render for current pagination mode.
   * @returns {Promise<void>}
   */
  async trigger() {
    let left

    switch (this.mode) {
      case 'local':
        left = this.table.rowManager.scrollLeft

        this.refreshData()
        this.table.rowManager.scrollHorizontal(left)

        this.dispatchExternal('pageLoaded', this.getPage())

        return Promise.resolve()

      case 'remote':
        this.dataChanging = true
        try {
          return await this.reloadData(null)
        } finally {
          this.dataChanging = false
        }

      case 'progressive_load':
      case 'progressive_scroll':
        return this.reloadData(null, true)

      default:
        this.logPageWarning('Pagination Error - no such pagination mode:', this.mode)
        return Promise.reject()
    }
  }

  /**
   * Parse and apply remote pagination response payload.
   * @param {object} data Remote response.
   * @returns {Array<object>|boolean|Promise<void>}
   */
  _parseRemoteData(data) {
    let margin, paginationOutOfRange

    if (typeof data.last_page === 'undefined') {
      this.logPageWarning(
        "Remote Pagination Error - Server response missing '" +
          (this.options('dataReceiveParams').last_page || 'last_page') +
          "' property"
      )
    }

    if (data.data) {
      const lastPage = parseInt(data.last_page, 10) || 1
      this.max = lastPage

      this.remoteRowCountEstimate =
        typeof data.last_row !== 'undefined'
          ? data.last_row
          : lastPage * this.size - (this.page === lastPage ? this.size - data.data.length : 0)

      if (this.progressiveLoad) {
        switch (this.mode) {
          case 'progressive_load':
            if (this.page === 1) {
              this.table.rowManager.setData(data.data, false, this.page === 1)
            } else {
              this.table.rowManager.addRows(data.data)
            }

            if (this.page < this.max) {
              setTimeout(() => {
                this.nextPage()
              }, this.table.options.progressiveLoadDelay)
            }
            break

          case 'progressive_scroll':
            data = this.page === 1 ? data.data : this.table.rowManager.getData().concat(data.data)

            this.table.rowManager.setData(data, this.page !== 1, this.page === 1)

            margin = this.table.options.progressiveLoadScrollMargin || this.table.rowManager.element.clientHeight * 2

            if (this.table.rowManager.element.scrollHeight <= this.table.rowManager.element.clientHeight + margin) {
              if (this.page < this.max) {
                setTimeout(() => {
                  this.nextPage()
                })
              }
            }
            break
        }

        return false
      } else {
        if (this.page > this.max) {
          this.logPageWarning('Remote Pagination Error - Server returned last page value lower than the current page')

          paginationOutOfRange = this.options('paginationOutOfRange')

          if (paginationOutOfRange) {
            return this.setPage(
              typeof paginationOutOfRange === 'function'
                ? paginationOutOfRange.call(this, this.page, this.max)
                : paginationOutOfRange
            )
          }
        }

        // left = this.table.rowManager.scrollLeft;
        this.dispatchExternal('pageLoaded', this.getPage())
        // this.table.rowManager.scrollHorizontal(left);
        // this.table.columnManager.scrollHorizontal(left);
      }
    } else {
      this.logPageWarning(
        "Remote Pagination Error - Server response missing '" +
          (this.options('dataReceiveParams').data || 'data') +
          "' property"
      )
    }

    return data.data
  }

  // handle the footer element being redrawn
  /**
   * Handle footer redraw and hide/show page list on overflow.
   * @returns {void}
   */
  footerRedraw() {
    const footer = this.table.footerManager.containerElement

    if (Math.ceil(footer.clientWidth) - footer.scrollWidth < 0) {
      this.pagesElement.style.display = 'none'
    } else {
      this.pagesElement.style.display = ''

      if (Math.ceil(footer.clientWidth) - footer.scrollWidth < 0) {
        this.pagesElement.style.display = 'none'
      }
    }
  }
}
