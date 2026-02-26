import maskInput from './inputMask.js'
import urlBuilder from '../Ajax/defaults/urlGenerator.js'

export default class Edit {
  /**
   * @param {object} editor Edit module.
   * @param {object} cell Internal cell wrapper.
   * @param {Function} onRendered Render callback registrar.
   * @param {Function} success Success callback.
   * @param {Function} cancel Cancel callback.
   * @param {object} editorParams Editor params.
   */
  constructor(editor, cell, onRendered, success, cancel, editorParams) {
    this.edit = editor
    this.table = editor.table
    this.cell = cell
    this.params = this._initializeParams(editorParams)

    this.data = []
    this.displayItems = []
    this.currentItems = []
    this.focusedItem = null

    this.input = this._createInputElement()
    this.listEl = this._createListElement()

    this.initialValues = null

    this.isFilter = cell.getType() === 'header'

    this.filterTimeout = null
    this.filtered = false
    this.typing = false

    this.values = []
    this.popup = null

    this.listIteration = 0

    this.lastAction = ''
    this.filterTerm = ''

    this.blurable = true

    this.actions = {
      success,
      cancel
    }

    this._deprecatedOptionsCheck()
    this._initializeValue()

    onRendered(this._onRendered.bind(this))
  }

  /**
   * Check deprecated editor options.
   */
  _deprecatedOptionsCheck() {}

  /**
   * Initialize current editor value state.
   */
  _initializeValue() {
    let initialValue = this.cell.getValue()

    if (initialValue === undefined && this.params.defaultValue !== undefined) {
      initialValue = this.params.defaultValue
    }

    this.initialValues = this.params.multiselect ? initialValue : [initialValue]

    if (this.isFilter) {
      this.input.value = this.initialValues ? this.initialValues.join(',') : ''
      this.headerFilterInitialListGen()
    }
  }

  /**
   * Post-render setup for list input.
   */
  _onRendered() {
    const cellEl = this.cell.getElement()

    const clickStop = (e) => {
      e.stopPropagation()
    }

    if (!this.isFilter) {
      this.input.classList.add('tabulator-editor-full-height')
      this.input.focus({ preventScroll: true })
    }

    cellEl.addEventListener('click', clickStop)

    setTimeout(() => {
      cellEl.removeEventListener('click', clickStop)
    }, 1000)

    this.input.addEventListener('mousedown', this._preventPopupBlur.bind(this))
  }

  /**
   * Create list element container.
   * @returns {HTMLDivElement}
   */
  _createListElement() {
    const listEl = document.createElement('div')
    listEl.classList.add('tabulator-edit-list')

    listEl.addEventListener('mousedown', this._preventBlur.bind(this))
    listEl.addEventListener('keydown', this._inputKeyDown.bind(this))

    return listEl
  }

  /**
   * Set list popup width constraints.
   */
  _setListWidth() {
    const element = this.isFilter ? this.input : this.cell.getElement()

    this.listEl.style.minWidth = `${element.offsetWidth}px`

    if (this.params.maxWidth) {
      if (this.params.maxWidth === true) {
        this.listEl.style.maxWidth = `${element.offsetWidth}px`
      } else if (typeof this.params.maxWidth === 'number') {
        this.listEl.style.maxWidth = `${this.params.maxWidth}px`
      } else {
        this.listEl.style.maxWidth = this.params.maxWidth
      }
    }
  }

  /**
   * Create input element for list editor.
   * @returns {HTMLInputElement}
   */
  _createInputElement() {
    const attribs = this.params.elementAttributes
    const input = document.createElement('input')

    input.setAttribute('type', this.params.clearable ? 'search' : 'text')
    input.setAttribute('name', 'tabulator-editor-input')

    input.classList.add('tabulator-editor-input')

    if (!this.params.autocomplete) {
      input.classList.add('tabulator-editor-static-input')
      // input.readOnly = (this.edit.currentCell != false);
    }

    if (attribs && typeof attribs === 'object') {
      for (let key in attribs) {
        if (key.charAt(0) === '+') {
          key = key.slice(1)
          input.setAttribute(key, input.getAttribute(key) + attribs[`+${key}`])
        } else {
          input.setAttribute(key, attribs[key])
        }
      }
    }

    if (this.params.mask) {
      maskInput(input, this.params)
    }

    this._bindInputEvents(input)

    return input
  }

  /**
   * Normalize and validate editor params.
   * @param {object} params Editor params.
   * @returns {object}
   */
  _initializeParams(params) {
    const valueKeys = ['values', 'valuesURL', 'valuesLookup']

    let valueCheck

    params = { ...params }

    params.verticalNavigation = params.verticalNavigation || 'editor'
    params.placeholderLoading = params.placeholderLoading === undefined ? 'Searching ...' : params.placeholderLoading
    params.placeholderEmpty = params.placeholderEmpty === undefined ? 'No Results Found' : params.placeholderEmpty
    params.filterDelay = params.filterDelay === undefined ? 300 : params.filterDelay

    params.emptyValue = Object.keys(params).includes('emptyValue') ? params.emptyValue : ''

    valueCheck = Object.keys(params).filter((key) => valueKeys.includes(key)).length

    if (!valueCheck) {
      console.warn('list editor config error - either the values, valuesURL, or valuesLookup option must be set')
    } else if (valueCheck > 1) {
      console.warn(
        'list editor config error - only one of the values, valuesURL, or valuesLookup options can be set on the same editor'
      )
    }

    if (params.autocomplete) {
      if (params.multiselect) {
        params.multiselect = false
        console.warn('list editor config error - multiselect option is not available when autocomplete is enabled')
      }
    } else {
      if (params.freetext) {
        params.freetext = false
        console.warn('list editor config error - freetext option is only available when autocomplete is enabled')
      }

      if (params.filterFunc) {
        params.filterFunc = false
        console.warn('list editor config error - filterFunc option is only available when autocomplete is enabled')
      }

      if (params.filterRemote) {
        params.filterRemote = false
        console.warn('list editor config error - filterRemote option is only available when autocomplete is enabled')
      }

      if (params.mask) {
        params.mask = false
        console.warn('list editor config error - mask option is only available when autocomplete is enabled')
      }

      if (params.allowEmpty) {
        params.allowEmpty = false
        console.warn('list editor config error - allowEmpty option is only available when autocomplete is enabled')
      }

      if (params.listOnEmpty) {
        params.listOnEmpty = false
        console.warn('list editor config error - listOnEmpty option is only available when autocomplete is enabled')
      }
    }

    if (params.filterRemote && !(typeof params.valuesLookup === 'function' || params.valuesURL)) {
      params.filterRemote = false
      console.warn(
        'list editor config error - filterRemote option should only be used when values list is populated from a remote source'
      )
    }
    return params
  }
  /// ///////////////////////////////////
  /// /////// Event Handling ////////////
  /// ///////////////////////////////////

  /**
   * Bind input event handlers.
   * @param {HTMLInputElement} input Input element.
   */
  _bindInputEvents(input) {
    input.addEventListener('focus', this._inputFocus.bind(this))
    input.addEventListener('click', this._inputClick.bind(this))
    input.addEventListener('blur', this._inputBlur.bind(this))
    input.addEventListener('keydown', this._inputKeyDown.bind(this))
    input.addEventListener('search', this._inputSearch.bind(this))

    if (this.params.autocomplete) {
      input.addEventListener('keyup', this._inputKeyUp.bind(this))
    }
  }

  /**
   * Input focus.
   */
  _inputFocus() {
    this.rebuildOptionsList()
  }

  /**
   * Filter list contents.
   */
  _filter() {
    if (this.params.filterRemote) {
      clearTimeout(this.filterTimeout)

      this.filterTimeout = setTimeout(() => {
        this.rebuildOptionsList()
      }, this.params.filterDelay)
    } else {
      this._filterList()
    }
  }

  /**
   * Handle input click.
   * @param {*} e - Parameter value.
   */
  _inputClick(e) {
    e.stopPropagation()
  }

  /**
   * Handle input blur.
   */
  _inputBlur() {
    if (this.blurable) {
      if (this.popup) {
        this.popup.hide()
      } else {
        this._resolveValue(true)
      }
    }
  }

  /**
   * Handle input search.
   */
  _inputSearch() {
    this._clearChoices()
  }

  /**
   * Handle input keydown.
   * @param {*} e - Parameter value.
   */
  _inputKeyDown(e) {
    switch (e.key) {
      case 'ArrowUp': // up arrow
        this._keyUp(e)
        break

      case 'ArrowDown': // down arrow
        this._keyDown(e)
        break

      case 'ArrowLeft': // left arrow
      case 'ArrowRight': // right arrow
        this._keySide(e)
        break

      case 'Enter': // enter
        this._keyEnter()
        break

      case 'Escape': // escape
        this._keyEsc()
        break

      case 'Home': // home
      case 'End': // end
        this._keyHomeEnd(e)
        break

      case 'Tab': // tab
        this._keyTab(e)
        break

      default:
        this._keySelectLetter(e)
    }
  }

  /**
   * Handle input keyup.
   * @param {*} e - Parameter value.
   */
  _inputKeyUp(e) {
    switch (e.key) {
      case 'ArrowUp': // up arrow
      case 'ArrowLeft': // left arrow
      case 'ArrowRight': // up arrow
      case 'ArrowDown': // right arrow
      case 'Enter': // enter
      case 'Escape': // escape
        break

      default:
        this._keyAutoCompLetter(e)
    }
  }

  /**
   * Prevent popup blur behavior.
   */
  _preventPopupBlur() {
    if (this.popup) {
      this.popup.blockHide()
    }

    setTimeout(() => {
      if (this.popup) {
        this.popup.restoreHide()
      }
    }, 10)
  }

  /**
   * Prevent blur behavior.
   */
  _preventBlur() {
    this.blurable = false

    setTimeout(() => {
      this.blurable = true
    }, 10)
  }

  /// ///////////////////////////////////
  /// ///// Keyboard Navigation /////////
  /// ///////////////////////////////////

  /**
   * Handle tab key behavior.
   */
  _keyTab() {
    if (this.params.autocomplete && this.lastAction === 'typing') {
      this._resolveValue(true)
    } else {
      if (this.focusedItem) {
        this._chooseItem(this.focusedItem, true)
      }
    }
  }

  /**
   * Handle up key behavior.
   * @param {*} e - Parameter value.
   */
  _keyUp(e) {
    const index = this.displayItems.indexOf(this.focusedItem)

    if (this.params.verticalNavigation === 'editor' || (this.params.verticalNavigation === 'hybrid' && index)) {
      e.stopImmediatePropagation()
      e.stopPropagation()
      e.preventDefault()

      if (index > 0) {
        this._focusItem(this.displayItems[index - 1])
        this._syncFocusedSelection()
      }
    }
  }

  /**
   * Handle down key behavior.
   * @param {*} e - Parameter value.
   */
  _keyDown(e) {
    const index = this.displayItems.indexOf(this.focusedItem)

    if (
      this.params.verticalNavigation === 'editor' ||
      (this.params.verticalNavigation === 'hybrid' && index < this.displayItems.length - 1)
    ) {
      e.stopImmediatePropagation()
      e.stopPropagation()
      e.preventDefault()

      if (index < this.displayItems.length - 1) {
        if (index === -1) {
          this._focusItem(this.displayItems[0])
        } else {
          this._focusItem(this.displayItems[index + 1])
        }

        this._syncFocusedSelection()
      }
    }
  }

  /**
   * Keep active item highlight in sync when navigating with keyboard.
   */
  _syncFocusedSelection() {
    if (this.params.autocomplete || this.params.multiselect || !this.focusedItem) {
      return
    }

    this.currentItems.forEach((item) => {
      if (item !== this.focusedItem) {
        item.selected = false
        this._styleItem(item)
      }
    })

    this.currentItems = [this.focusedItem]
    this.focusedItem.selected = true
    this.input.value = this.focusedItem.label
    this._styleItem(this.focusedItem)
  }

  /**
   * Handle horizontal key behavior.
   * @param {*} e - Parameter value.
   */
  _keySide(e) {
    if (!this.params.autocomplete) {
      e.stopImmediatePropagation()
      e.stopPropagation()
      e.preventDefault()
    }
  }

  /**
   * Handle enter key behavior.
   */
  _keyEnter() {
    if (this.params.autocomplete && this.lastAction === 'typing') {
      this._resolveValue(true)
    } else {
      if (this.focusedItem) {
        this._chooseItem(this.focusedItem)
      }
    }
  }

  /**
   * Handle escape key behavior.
   */
  _keyEsc() {
    this._cancel()
  }

  /**
   * Handle home/end key behavior.
   * @param {*} e - Parameter value.
   */
  _keyHomeEnd(e) {
    if (this.params.autocomplete) {
      // prevent table navigation while using input element
      e.stopImmediatePropagation()
    }
  }

  /**
   * Handle key-based letter selection.
   * @param {*} e - Parameter value.
   */
  _keySelectLetter(e) {
    if (!this.params.autocomplete) {
      // if(this.edit.currentCell === false){
      e.preventDefault()
      // }

      if (e.key && e.key.length === 1) {
        this._scrollToValue(e.key)
      }
    }
  }

  /**
   * Handle autocomplete letter behavior.
   */
  _keyAutoCompLetter() {
    this._filter()
    this.lastAction = 'typing'
    this.typing = true
  }

  /**
   * Scroll to an item by character.
   * @param {*} char - Parameter value.
   * @returns {*} Return value.
   */
  _scrollToValue(char) {
    clearTimeout(this.filterTimeout)

    const character = String(char).toLowerCase().charAt(0)

    if (!character) {
      return
    }

    this.filterTerm += character

    const match = this.displayItems.find(
      (item) => item.label !== undefined && item.label.toLowerCase().startsWith(this.filterTerm)
    )

    if (match) {
      this._focusItem(match)
    }

    this.filterTimeout = setTimeout(() => {
      this.filterTerm = ''
    }, 800)
  }

  /**
   * Focus a list item.
   * @param {*} item - Parameter value.
   */
  _focusItem(item) {
    this.lastAction = 'focus'

    if (this.focusedItem && this.focusedItem.element) {
      this.focusedItem.element.classList.remove('focused')
    }

    this.focusedItem = item

    if (item && item.element) {
      item.element.classList.add('focused')
      item.element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }
  }

  /// ///////////////////////////////////
  /// //// Data List Generation /////////
  /// ///////////////////////////////////
  /**
   * Generate initial header filter list values.
   */
  headerFilterInitialListGen() {
    this._generateOptions(true)
  }

  /**
   * Rebuild options and show list popup.
   */
  rebuildOptionsList() {
    this._generateOptions()
      .then((options) => this._sortOptions(options))
      .then((options) => this._buildList(options))
      .then(() => this._showList())
      .catch((e) => {
        if (!Number.isInteger(e)) {
          console.error('List generation error', e)
        }
      })
  }
  /**
   * Apply filtering to visible list items.
   */
  _filterList() {
    this._buildList(this._filterOptions())
    this._showList()
  }

  /**
   * Generate options from configured source.
   * @param {boolean} [silent] Silent placeholder mode.
   * @returns {Promise<Array<object>>}
   */
  async _generateOptions(silent) {
    const iteration = ++this.listIteration

    let values = []

    this.filtered = false

    if (this.params.values) {
      values = this.params.values
    } else if (this.params.valuesURL) {
      values = this._ajaxRequest(this.params.valuesURL, this.input.value)
    } else {
      if (typeof this.params.valuesLookup === 'function') {
        values = this.params.valuesLookup(this.cell, this.input.value)
      } else if (this.params.valuesLookup) {
        values = this._uniqueColumnValues(this.params.valuesLookupField)
      }
    }

    if (values instanceof Promise) {
      if (!silent) {
        this._addPlaceholder(this.params.placeholderLoading)
      }

      const responseValues = await values
      if (this.listIteration === iteration) {
        return this._parseList(responseValues)
      } else {
        return Promise.reject(iteration)
      }
    } else {
      return Promise.resolve(this._parseList(values))
    }
  }

  /**
   * Add placeholder list content.
   * @param {*} contents - Parameter value.
   */
  _addPlaceholder(contents) {
    let placeholder = document.createElement('div')

    if (typeof contents === 'function') {
      contents = contents(this.cell.getComponent(), this.listEl)
    }

    if (contents) {
      this._clearList()

      if (contents instanceof HTMLElement) {
        placeholder = contents
      } else {
        placeholder.classList.add('tabulator-edit-list-placeholder')
        placeholder.innerHTML = contents
      }

      this.listEl.appendChild(placeholder)

      this._showList()
    }
  }

  /**
   * Fetch remote option values.
   * @param {string} url Source URL.
   * @param {string} term Filter term.
   * @returns {Promise<*>}
   */
  async _ajaxRequest(url, term) {
    const params = this.params.filterRemote ? { term } : {}
    url = urlBuilder(url, {}, params)

    return fetch(url)
      .then((response) => {
        if (response.ok) {
          return response.json().catch((error) => {
            console.warn('List Ajax Load Error - Invalid JSON returned', error)
            return Promise.reject(error)
          })
        } else {
          console.error('List Ajax Load Error - Connection Error: ' + response.status, response.statusText)
          return Promise.reject(response)
        }
      })
      .catch((error) => {
        console.error('List Ajax Load Error - Connection Error: ', error)
        return Promise.reject(error)
      })
  }

  /**
   * Build unique values from a column.
   * @param {string} [field] Field name override.
   * @returns {Array<string>}
   */
  _uniqueColumnValues(field) {
    const data = this.table.getData(this.params.valuesLookup)

    let output = {}
    let column

    if (field) {
      column = this.table.columnManager.getColumnByField(field)
    } else {
      column = this.cell.getColumn()._getSelf()
    }

    if (column) {
      data.forEach((row) => {
        const val = column.getFieldValue(row)

        if (!this._emptyValueCheck(val)) {
          if (this.params.multiselect && Array.isArray(val)) {
            val.forEach((item) => {
              if (!this._emptyValueCheck(item)) {
                output[item] = true
              }
            })
          } else {
            output[val] = true
          }
        }
      })
    } else {
      console.warn('unable to find matching column to create select lookup list:', field)
      output = []
    }

    return Object.keys(output)
  }

  /**
   * Check whether a value is considered empty.
   * @param {*} value - Parameter value.
   * @returns {*} Return value.
   */
  _emptyValueCheck(value) {
    return value == null || value === ''
  }

  /**
   * Parse list input values.
   * @param {*} inputValues - Parameter value.
   * @returns {*} Return value.
   */
  _parseList(inputValues) {
    const data = []

    if (!Array.isArray(inputValues)) {
      inputValues = Object.entries(inputValues).map(([key, value]) => {
        return {
          label: value,
          value: key
        }
      })
    }

    inputValues.forEach((value) => {
      if (typeof value !== 'object') {
        value = {
          label: value,
          value
        }
      }

      this._parseListItem(value, data, 0)
    })

    if (!this.currentItems.length && this.params.freetext) {
      this.input.value = this.initialValues
      this.typing = true
      this.lastAction = 'typing'
    }

    this.data = data

    return data
  }

  /**
   * Parse a list item option.
   * @param {*} option - Parameter value.
   * @param {*} data - Parameter value.
   * @param {*} level - Parameter value.
   */
  _parseListItem(option, data, level) {
    let item

    if (option.options) {
      item = this._parseListGroup(option, level + 1)
    } else {
      item = {
        label: option.label,
        value: option.value,
        itemParams: option.itemParams,
        elementAttributes: option.elementAttributes,
        element: false,
        selected: false,
        visible: true,
        level,
        original: option
      }

      if (this.initialValues && this.initialValues.includes(option.value)) {
        this._chooseItem(item, true)
      }
    }

    data.push(item)
  }

  /**
   * Parse a grouped list option.
   * @param {*} option - Parameter value.
   * @param {*} level - Parameter value.
   * @returns {*} Return value.
   */
  _parseListGroup(option, level) {
    const item = {
      label: option.label,
      group: true,
      itemParams: option.itemParams,
      elementAttributes: option.elementAttributes,
      element: false,
      visible: true,
      level,
      options: [],
      original: option
    }

    option.options.forEach((child) => {
      this._parseListItem(child, item.options, level)
    })

    return item
  }

  /**
   * Sort list options.
   * @param {*} options - Parameter value.
   * @returns {*} Return value.
   */
  _sortOptions(options) {
    let sorter

    if (this.params.sort) {
      sorter = typeof this.params.sort === 'function' ? this.params.sort : this._defaultSortFunction.bind(this)

      this._sortGroup(sorter, options)
    }

    return options
  }

  /**
   * Sort a grouped option set.
   * @param {*} sorter - Parameter value.
   * @param {*} options - Parameter value.
   */
  _sortGroup(sorter, options) {
    options.sort((a, b) => sorter(a.label, b.label, a.value, b.value, a.original, b.original))

    options.forEach((option) => {
      if (option.group) {
        this._sortGroup(sorter, option.options)
      }
    })
  }

  /**
   * Default sort comparator.
   * @param {*} as - Parameter value.
   * @param {*} bs - Parameter value.
   * @returns {*} Return value.
   */
  _defaultSortFunction(as, bs) {
    const rx = /(\d+)|(\D+)/g
    const rd = /\d/

    let a
    let b
    let a1
    let b1
    let i = 0
    let L
    let emptyAlign

    if (this.params.sort === 'desc') {
      ;[as, bs] = [bs, as]
    }

    // handle empty values
    if (!as && as !== 0) {
      emptyAlign = !bs && bs !== 0 ? 0 : -1
    } else if (!bs && bs !== 0) {
      emptyAlign = 1
    } else {
      if (isFinite(as) && isFinite(bs)) return as - bs
      a = String(as).toLowerCase()
      b = String(bs).toLowerCase()
      if (a === b) return 0
      if (!(rd.test(a) && rd.test(b))) return a > b ? 1 : -1
      a = a.match(rx)
      b = b.match(rx)
      L = a.length > b.length ? b.length : a.length
      while (i < L) {
        a1 = a[i]
        b1 = b[i++]
        if (a1 !== b1) {
          if (isFinite(a1) && isFinite(b1)) {
            if (a1.charAt(0) === '0') a1 = '.' + a1
            if (b1.charAt(0) === '0') b1 = '.' + b1
            return a1 - b1
          } else return a1 > b1 ? 1 : -1
        }
      }

      return a.length > b.length
    }

    return emptyAlign
  }

  /**
   * Filter available options.
   * @returns {*} Return value.
   */
  _filterOptions() {
    const filterFunc = this.params.filterFunc || this._defaultFilterFunc
    const term = this.input.value

    if (term) {
      this.filtered = true

      this.data.forEach((item) => {
        this._filterItem(filterFunc, term, item)
      })
    } else {
      this.filtered = false
    }

    return this.data
  }

  /**
   * Evaluate a single option against a filter.
   * @param {*} func - Parameter value.
   * @param {*} term - Parameter value.
   * @param {*} item - Parameter value.
   * @returns {*} Return value.
   */
  _filterItem(func, term, item) {
    let matches = false

    if (!item.group) {
      item.visible = func(term, item.label, item.value, item.original)
    } else {
      item.options.forEach((option) => {
        if (this._filterItem(func, term, option)) {
          matches = true
        }
      })

      item.visible = matches
    }

    return item.visible
  }

  /**
   * Default item filter predicate.
   * @param {*} term - Parameter value.
   * @param {*} label - Parameter value.
   * @param {*} value - Parameter value.
   * @returns {*} Return value.
   */
  _defaultFilterFunc(term, label, value) {
    term = String(term).toLowerCase()

    if (label != null) {
      if (String(label).toLowerCase().includes(term) || String(value).toLowerCase().includes(term)) {
        return true
      }
    }

    return false
  }

  /// ///////////////////////////////////
  /// //////// Display List /////////////
  /// ///////////////////////////////////

  /**
   * Clear rendered list items.
   */
  _clearList() {
    this.listEl.replaceChildren()

    this.displayItems = []
  }

  /**
   * Build list DOM from option data.
   * @param {Array<object>} data Option data.
   */
  _buildList(data) {
    this._clearList()

    data.forEach((option) => {
      this._buildItem(option)
    })

    if (!this.displayItems.length) {
      this._addPlaceholder(this.params.placeholderEmpty)
    }
  }

  /**
   * Build a list item element.
   * @param {*} item - Parameter value.
   */
  _buildItem(item) {
    let el = item.element
    let contents

    if (!this.filtered || item.visible) {
      if (!el) {
        el = document.createElement('div')
        el.tabIndex = 0

        contents = this.params.itemFormatter
          ? this.params.itemFormatter(item.label, item.value, item.original, el)
          : item.label

        if (contents instanceof HTMLElement) {
          el.appendChild(contents)
        } else {
          el.innerHTML = contents
        }

        if (item.group) {
          el.classList.add('tabulator-edit-list-group')
        } else {
          el.classList.add('tabulator-edit-list-item')
        }

        el.classList.add(`tabulator-edit-list-group-level-${item.level}`)

        if (item.elementAttributes && typeof item.elementAttributes === 'object') {
          for (let key in item.elementAttributes) {
            if (key.charAt(0) === '+') {
              key = key.slice(1)
              el.setAttribute(key, (el.getAttribute(key) || '') + item.elementAttributes[`+${key}`])
            } else {
              el.setAttribute(key, item.elementAttributes[key])
            }
          }
        }

        if (item.group) {
          el.addEventListener('click', this._groupClick.bind(this, item))
        } else {
          el.addEventListener('click', this._itemClick.bind(this, item))
        }

        el.addEventListener('mousedown', this._preventBlur.bind(this))

        item.element = el
      }

      this._styleItem(item)

      this.listEl.appendChild(el)

      if (item.group) {
        item.options.forEach((option) => {
          this._buildItem(option)
        })
      } else {
        this.displayItems.push(item)
      }
    }
  }

  /**
   * Show list popup.
   */
  _showList() {
    const startVis = this.popup && this.popup.isVisible()

    if (this.input.parentNode) {
      if (this.params.autocomplete && this.input.value === '' && !this.params.listOnEmpty) {
        if (this.popup) {
          this.popup.hide(true)
        }
        return
      }

      this._setListWidth()

      if (!this.popup) {
        this.popup = this.edit.popup(this.listEl)
      }

      this.popup.show(this.cell.getElement(), 'bottom')

      if (!startVis) {
        setTimeout(() => {
          this.popup.hideOnBlur(this._resolveValue.bind(this, true))
        }, 10)
      }
    }
  }

  /**
   * Apply style rules to a list item.
   * @param {*} item - Parameter value.
   */
  _styleItem(item) {
    if (item && item.element) {
      if (item.selected) {
        item.element.classList.add('active')
      } else {
        item.element.classList.remove('active')
      }
    }
  }

  /// ///////////////////////////////////
  /// ////// User Interaction ///////////
  /// ///////////////////////////////////

  /**
   * Handle item click.
   * @param {*} item - Parameter value.
   * @param {*} e - Parameter value.
   */
  _itemClick(item, e) {
    e.stopPropagation()

    this._chooseItem(item)
  }

  /**
   * Handle group click.
   * @param {*} item - Parameter value.
   * @param {*} e - Parameter value.
   */
  _groupClick(item, e) {
    e.stopPropagation()
  }

  /// ///////////////////////////////////
  /// /// Current Item Management ///////
  /// ///////////////////////////////////

  /**
   * Cancel list editing.
   */
  _cancel() {
    this.popup.hide(true)
    this.actions.cancel()
  }

  /**
   * Clear selected choices.
   */
  _clearChoices() {
    this.typing = true

    this.currentItems.forEach((item) => {
      item.selected = false
      this._styleItem(item)
    })

    this.currentItems = []

    this.focusedItem = null
  }

  /**
   * Choose an item in the list.
   * @param {object} item List item.
   * @param {boolean} [silent] Skip auto-resolve.
   */
  _chooseItem(item, silent) {
    let index

    this.typing = false

    if (this.params.multiselect) {
      index = this.currentItems.indexOf(item)

      if (index > -1) {
        this.currentItems.splice(index, 1)
        item.selected = false
      } else {
        this.currentItems.push(item)
        item.selected = true
      }

      this.input.value = this.currentItems.map((item) => item.label).join(',')

      this._styleItem(item)
    } else {
      this.currentItems = [item]
      item.selected = true

      this.input.value = item.label

      this._styleItem(item)

      if (!silent) {
        this._resolveValue()
      }
    }

    this._focusItem(item)
  }

  /**
   * Resolve current value and call success callback.
   * @param {boolean} [blur] Triggered by blur.
   */
  _resolveValue(blur) {
    let output, initialValue

    if (this.popup) {
      this.popup.hide(true)
    }

    if (this.params.multiselect) {
      output = this.currentItems.map((item) => item.value)
    } else {
      if (blur && this.params.autocomplete && this.typing) {
        if (this.params.freetext || (this.params.allowEmpty && this.input.value === '')) {
          output = this.input.value
        } else {
          this.actions.cancel()
          return
        }
      } else {
        if (this.currentItems[0]) {
          output = this.currentItems[0].value
        } else {
          initialValue = Array.isArray(this.initialValues) ? this.initialValues[0] : this.initialValues

          if (initialValue == null || initialValue === '') {
            output = initialValue
          } else {
            output = this.params.emptyValue
          }
        }
      }
    }

    if (output === '') {
      output = this.params.emptyValue
    }

    this.actions.success(output)

    if (this.isFilter) {
      this.initialValues = output && !Array.isArray(output) ? [output] : output
      this.currentItems = []
    }
  }
}
