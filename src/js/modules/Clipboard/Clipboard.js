import Module from '../../core/Module.js'

import defaultPasteActions from './defaults/pasteActions.js'
import defaultPasteParsers from './defaults/pasteParsers.js'
import extensions from './extensions/extensions.js'

export default class Clipboard extends Module {
  static moduleName = 'clipboard'
  static moduleExtensions = extensions

  // load defaults
  static pasteActions = defaultPasteActions
  static pasteParsers = defaultPasteParsers

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.mode = true
    this.pasteParser = () => {}
    this.pasteAction = () => {}
    this.customSelection = false
    this.rowRange = false
    this.blocked = true // block copy actions not originating from this command

    this.registerTableOption('clipboard', false) // enable clipboard
    this.registerTableOption('clipboardCopyStyled', true) // formatted table data
    this.registerTableOption('clipboardCopyConfig', false) // clipboard config
    this.registerTableOption('clipboardCopyFormatter', false) // DEPRECATED - REMOVE in 5.0
    this.registerTableOption('clipboardCopyRowRange', 'active') // restrict clipboard to visible rows only
    this.registerTableOption('clipboardPasteParser', 'table') // convert pasted clipboard data to rows
    this.registerTableOption('clipboardPasteAction', 'insert') // how to insert pasted data into the table

    this.registerColumnOption('clipboard')
    this.registerColumnOption('titleClipboard')
  }

  /**
   * Initialize clipboard copy/paste behavior and table APIs.
   * @returns {void}
   */
  initialize() {
    this.mode = this.table.options.clipboard

    this.rowRange = this.table.options.clipboardCopyRowRange

    if (this.mode === true || this.mode === 'copy') {
      this.table.element.addEventListener('copy', (e) => {
        let plain, html, list

        if (!this.blocked) {
          e.preventDefault()

          if (this.customSelection) {
            plain = this.customSelection

            if (this.table.options.clipboardCopyFormatter) {
              plain = this.table.options.clipboardCopyFormatter('plain', plain)
            }
          } else {
            list = this.table.modules.export.generateExportList(
              this.table.options.clipboardCopyConfig,
              this.table.options.clipboardCopyStyled,
              this.rowRange,
              'clipboard'
            )

            html = this.table.modules.export.generateHTMLTable(list)
            plain = html ? this.generatePlainContent(list) : ''

            if (this.table.options.clipboardCopyFormatter) {
              plain = this.table.options.clipboardCopyFormatter('plain', plain)
              html = this.table.options.clipboardCopyFormatter('html', html)
            }
          }

          if (window.clipboardData && window.clipboardData.setData) {
            window.clipboardData.setData('Text', plain)
          } else if (e.clipboardData && e.clipboardData.setData) {
            e.clipboardData.setData('text/plain', plain)
            if (html) {
              e.clipboardData.setData('text/html', html)
            }
          } else if (e.originalEvent && e.originalEvent.clipboardData.setData) {
            e.originalEvent.clipboardData.setData('text/plain', plain)
            if (html) {
              e.originalEvent.clipboardData.setData('text/html', html)
            }
          }

          this.dispatchExternal('clipboardCopied', plain, html)

          this.reset()
        }
      })
    }

    if (this.mode === true || this.mode === 'paste') {
      this.table.element.addEventListener('paste', this.paste.bind(this))
    }

    this.setPasteParser(this.table.options.clipboardPasteParser)
    this.setPasteAction(this.table.options.clipboardPasteAction)

    this.registerTableFunction('copyToClipboard', this.copy.bind(this))
  }

  /**
   * Reset clipboard transient state.
   * @returns {void}
   */
  reset() {
    this.blocked = true
    this.customSelection = false
  }

  /**
   * Generate plain text clipboard output from export rows.
   * @param {Array<object>} list Export rows.
   * @returns {string}
   */
  generatePlainContent(list) {
    const output = []

    list.forEach((row) => {
      const rowData = []

      row.columns.forEach((col) => {
        let value = ''

        if (col) {
          if (row.type === 'group') {
            col.value = col.component.getKey()
          }

          if (col.value === null) {
            value = ''
          } else {
            switch (typeof col.value) {
              case 'object':
                value = JSON.stringify(col.value)
                break

              case 'undefined':
                value = ''
                break

              default:
                value = col.value
            }
          }
        }

        rowData.push(value)
      })

      output.push(rowData.join('\t'))
    })

    return output.join('\n')
  }

  /**
   * Copy table content to clipboard.
   * @param {string|Function} [range] Row range selector.
   * @param {boolean} [internal] Preserve user selection if present.
   * @returns {void}
   */
  copy(range, internal) {
    let sel, textRange
    this.blocked = false
    this.customSelection = false

    if (this.mode === true || this.mode === 'copy') {
      this.rowRange = range || this.table.options.clipboardCopyRowRange

      if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
        range = document.createRange()
        range.selectNodeContents(this.table.element)
        sel = window.getSelection()

        if (sel.toString() && internal) {
          this.customSelection = sel.toString()
        }

        sel.removeAllRanges()
        sel.addRange(range)
      } else if (typeof document.selection !== 'undefined' && typeof document.body.createTextRange !== 'undefined') {
        textRange = document.body.createTextRange()
        textRange.moveToElementText(this.table.element)
        textRange.select()
      }

      document.execCommand('copy')

      if (sel) {
        sel.removeAllRanges()
      }
    }
  }

  // PASTE EVENT HANDLING
  /**
   * Configure paste action handler.
   * @param {string|Function} action Paste action key or function.
   * @returns {void}
   */
  setPasteAction(action) {
    if (typeof action === 'function') {
      this.pasteAction = action
      return
    }

    if (typeof action === 'string') {
      this.pasteAction = Clipboard.pasteActions[action]

      if (!this.pasteAction) {
        console.warn('Clipboard Error - No such paste action found:', action)
      }
    }
  }

  /**
   * Configure paste parser handler.
   * @param {string|Function} parser Paste parser key or function.
   * @returns {void}
   */
  setPasteParser(parser) {
    if (typeof parser === 'function') {
      this.pasteParser = parser
      return
    }

    if (typeof parser === 'string') {
      this.pasteParser = Clipboard.pasteParsers[parser]

      if (!this.pasteParser) {
        console.warn('Clipboard Error - No such paste parser found:', parser)
      }
    }
  }

  /**
   * Handle paste event, parse data, and dispatch action.
   * @param {ClipboardEvent} e Paste event.
   * @returns {void}
   */
  paste(e) {
    let data, rowData, rows

    if (this.checkPasteOrigin(e)) {
      data = this.getPasteData(e)

      rowData = this.pasteParser.call(this, data)

      if (rowData) {
        e.preventDefault()

        if (this.table.modExists('mutator')) {
          rowData = this.mutateData(rowData)
        }

        rows = this.pasteAction.call(this, rowData)

        this.dispatchExternal('clipboardPasted', data, rowData, rows)
      } else {
        this.dispatchExternal('clipboardPasteError', data)
      }
    }
  }

  /**
   * Apply clipboard mutators to parsed row data.
   * @param {*} data Parsed clipboard data.
   * @returns {*}
   */
  mutateData(data) {
    if (Array.isArray(data)) {
      return data.map((row) => this.table.modules.mutator.transformRow(row, 'clipboard'))
    }

    return data
  }

  /**
   * Verify paste originated from an allowed target.
   * @param {ClipboardEvent} e Paste event.
   * @returns {boolean}
   */
  checkPasteOrigin(e) {
    const blocked = this.confirm('clipboard-paste', [e])
    const tagName = e.target && e.target.tagName ? e.target.tagName : ''

    return !(blocked || !['DIV', 'SPAN'].includes(tagName))
  }

  /**
   * Extract plain text data from clipboard event.
   * @param {ClipboardEvent} e Clipboard event.
   * @returns {string|undefined}
   */
  getPasteData(e) {
    let data

    if (window.clipboardData && window.clipboardData.getData) {
      data = window.clipboardData.getData('Text')
    } else if (e.clipboardData && e.clipboardData.getData) {
      data = e.clipboardData.getData('text/plain')
    } else if (e.originalEvent && e.originalEvent.clipboardData.getData) {
      data = e.originalEvent.clipboardData.getData('text/plain')
    }

    return data
  }
}
