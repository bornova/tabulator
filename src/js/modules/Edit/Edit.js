import Module from '../../core/Module.js'
import Helpers from '../../core/tools/Helpers.js'

import defaultEditors from './defaults/editors.js'

export default class Edit extends Module {
  static moduleName = 'edit'

  // load defaults
  static editors = defaultEditors

  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)

    this.currentCell = false // hold currently editing cell
    this.mouseClick = false // hold mousedown state to prevent click binding being overridden by editor opening
    this.recursionBlock = false // prevent focus recursion
    this.invalidEdit = false
    this.editedCells = []
    this.convertEmptyValues = false

    this.editors = Edit.editors

    this.registerTableOption('editTriggerEvent', 'focus')
    this.registerTableOption('editorEmptyValue')
    this.registerTableOption('editorEmptyValueFunc', this.emptyValueCheck.bind(this))

    this.registerColumnOption('editable')
    this.registerColumnOption('editor')
    this.registerColumnOption('editorParams')
    this.registerColumnOption('editorEmptyValue')
    this.registerColumnOption('editorEmptyValueFunc')

    this.registerColumnOption('cellEditing')
    this.registerColumnOption('cellEdited')
    this.registerColumnOption('cellEditCancelled')

    this.registerTableFunction('getEditedCells', this.getEditedCells.bind(this))
    this.registerTableFunction('clearCellEdited', this.clearCellEdited.bind(this))
    this.registerTableFunction('navigatePrev', this.navigatePrev.bind(this))
    this.registerTableFunction('navigateNext', this.navigateNext.bind(this))
    this.registerTableFunction('navigateLeft', this.navigateLeft.bind(this))
    this.registerTableFunction('navigateRight', this.navigateRight.bind(this))
    this.registerTableFunction('navigateUp', this.navigateUp.bind(this))
    this.registerTableFunction('navigateDown', this.navigateDown.bind(this))

    this.registerComponentFunction('cell', 'isEdited', this.cellIsEdited.bind(this))
    this.registerComponentFunction('cell', 'clearEdited', this.clearEdited.bind(this))
    this.registerComponentFunction('cell', 'edit', this.editCell.bind(this))
    this.registerComponentFunction('cell', 'cancelEdit', this.cellCancelEdit.bind(this))

    this.registerComponentFunction('cell', 'navigatePrev', this.navigatePrev.bind(this))
    this.registerComponentFunction('cell', 'navigateNext', this.navigateNext.bind(this))
    this.registerComponentFunction('cell', 'navigateLeft', this.navigateLeft.bind(this))
    this.registerComponentFunction('cell', 'navigateRight', this.navigateRight.bind(this))
    this.registerComponentFunction('cell', 'navigateUp', this.navigateUp.bind(this))
    this.registerComponentFunction('cell', 'navigateDown', this.navigateDown.bind(this))
  }

  /**
   * Initialize edit module subscriptions.
   */
  initialize() {
    this.subscribe('cell-init', this.bindEditor.bind(this))
    this.subscribe('cell-delete', this.clearEdited.bind(this))
    this.subscribe('cell-value-changed', this.updateCellClass.bind(this))
    this.subscribe('column-layout', this.initializeColumnCheck.bind(this))
    this.subscribe('column-delete', this.columnDeleteCheck.bind(this))
    this.subscribe('row-deleting', this.rowDeleteCheck.bind(this))
    this.subscribe('row-layout', this.rowEditableCheck.bind(this))
    this.subscribe('data-refreshing', this.cancelEdit.bind(this))
    this.subscribe('clipboard-paste', this.pasteBlocker.bind(this))

    this.subscribe('keybinding-nav-prev', this.navigatePrev.bind(this, undefined))
    this.subscribe('keybinding-nav-next', this.keybindingNavigateNext.bind(this))

    // this.subscribe("keybinding-nav-left", this.navigateLeft.bind(this, undefined));
    // this.subscribe("keybinding-nav-right", this.navigateRight.bind(this, undefined));
    this.subscribe('keybinding-nav-up', this.navigateUp.bind(this, undefined))
    this.subscribe('keybinding-nav-down', this.navigateDown.bind(this, undefined))

    if (Object.keys(this.table.options).includes('editorEmptyValue')) {
      this.convertEmptyValues = true
    }
  }

  /// ////////////////////////////////
  /// ////// Paste Negation //////////
  /// ////////////////////////////////

  /**
   * Block clipboard paste while a cell is actively editing.
   * @returns {boolean|undefined}
   */
  pasteBlocker() {
    return !!this.currentCell
  }

  /// ////////////////////////////////
  /// /// Keybinding Functions ///////
  /// ////////////////////////////////

  /**
   * Handle keyboard navigate-next behavior and optional new-row creation.
   * @param {KeyboardEvent} e Keyboard event.
   */
  keybindingNavigateNext(e) {
    const cell = this.currentCell

    let newRow = this.options('tabEndNewRow')

    if (cell) {
      if (!this.navigateNext(cell, e)) {
        if (newRow) {
          cell.getElement().firstChild.blur()

          if (!this.invalidEdit) {
            if (newRow === true) {
              newRow = this.table.addRow({})
            } else {
              if (typeof newRow === 'function') {
                newRow = this.table.addRow(newRow(cell.row.getComponent()))
              } else {
                newRow = this.table.addRow({ ...newRow })
              }
            }

            newRow.then(() => {
              setTimeout(() => {
                cell.getComponent().navigateNext()
              })
            })
          }
        }
      }
    }
  }

  /// ////////////////////////////////
  /// ////// Cell Functions //////////
  /// ////////////////////////////////

  /**
   * Check if a cell has been edited.
   * @param {object} cell Internal cell.
   * @returns {boolean}
   */
  cellIsEdited(cell) {
    return !!cell.modules.edit && cell.modules.edit.edited
  }

  /**
   * Cancel edit for a specific cell component if active.
   * @param {object} cell Internal cell.
   */
  cellCancelEdit(cell) {
    if (cell === this.currentCell) {
      this.table.modules.edit.cancelEdit()
    } else {
      console.warn('Cancel Editor Error - This cell is not currently being edited ')
    }
  }

  /// ////////////////////////////////
  /// ////// Table Functions /////////
  /// ////////////////////////////////
  /**
   * Toggle editable CSS state on a cell.
   * @param {object} cell Internal cell.
   */
  updateCellClass(cell) {
    if (this.allowEdit(cell)) {
      cell.getElement().classList.add('tabulator-editable')
    } else {
      cell.getElement().classList.remove('tabulator-editable')
    }
  }

  /**
   * Clear edited-state tracking for one or more cells.
   * @param {object|Array<object>} [cells] Cell component(s).
   */
  clearCellEdited(cells) {
    if (!cells) {
      cells = this.table.modules.edit.getEditedCells()
    }

    if (!Array.isArray(cells)) {
      cells = [cells]
    }

    cells.forEach((cell) => {
      this.table.modules.edit.clearEdited(cell._getSelf())
    })
  }

  /**
   * Navigate to previous editable cell.
   * @param {object} [cell=this.currentCell] Starting cell.
   * @param {Event} [e] Trigger event.
   * @returns {boolean}
   */
  navigatePrev(cell = this.currentCell, e) {
    let nextCell, prevRow

    if (cell) {
      if (e) {
        e.preventDefault()
      }

      nextCell = this.navigateLeft()

      if (nextCell) {
        return true
      } else {
        prevRow = this.table.rowManager.prevDisplayRow(cell.row, true)

        if (prevRow) {
          nextCell = this.findPrevEditableCell(prevRow, prevRow.cells.length)

          if (nextCell) {
            nextCell.getComponent().edit()
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * Navigate to next editable cell.
   * @param {object} [cell=this.currentCell] Starting cell.
   * @param {Event} [e] Trigger event.
   * @returns {boolean}
   */
  navigateNext(cell = this.currentCell, e) {
    let nextCell, nextRow

    if (cell) {
      if (e) {
        e.preventDefault()
      }

      nextCell = this.navigateRight()

      if (nextCell) {
        return true
      } else {
        nextRow = this.table.rowManager.nextDisplayRow(cell.row, true)

        if (nextRow) {
          nextCell = this.findNextEditableCell(nextRow, -1)

          if (nextCell) {
            nextCell.getComponent().edit()
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * Navigate left to previous editable cell in row.
   * @param {object} [cell=this.currentCell] Starting cell.
   * @param {Event} [e] Trigger event.
   * @returns {boolean}
   */
  navigateLeft(cell = this.currentCell, e) {
    let index, nextCell

    if (cell) {
      if (e) {
        e.preventDefault()
      }

      index = cell.getIndex()
      nextCell = this.findPrevEditableCell(cell.row, index)

      if (nextCell) {
        nextCell.getComponent().edit()
        return true
      }
    }

    return false
  }

  /**
   * Navigate right to next editable cell in row.
   * @param {object} [cell=this.currentCell] Starting cell.
   * @param {Event} [e] Trigger event.
   * @returns {boolean}
   */
  navigateRight(cell = this.currentCell, e) {
    let index, nextCell

    if (cell) {
      if (e) {
        e.preventDefault()
      }

      index = cell.getIndex()
      nextCell = this.findNextEditableCell(cell.row, index)

      if (nextCell) {
        nextCell.getComponent().edit()
        return true
      }
    }

    return false
  }

  /**
   * Navigate up to editable cell in previous display row.
   * @param {object} [cell=this.currentCell] Starting cell.
   * @param {Event} [e] Trigger event.
   * @returns {boolean}
   */
  navigateUp(cell = this.currentCell, e) {
    let index, nextRow

    if (cell) {
      if (e) {
        e.preventDefault()
      }

      index = cell.getIndex()
      nextRow = this.table.rowManager.prevDisplayRow(cell.row, true)

      if (nextRow) {
        nextRow.cells[index].getComponent().edit()
        return true
      }
    }

    return false
  }

  /**
   * Navigate down to editable cell in next display row.
   * @param {object} [cell=this.currentCell] Starting cell.
   * @param {Event} [e] Trigger event.
   * @returns {boolean}
   */
  navigateDown(cell = this.currentCell, e) {
    let index, nextRow

    if (cell) {
      if (e) {
        e.preventDefault()
      }

      index = cell.getIndex()
      nextRow = this.table.rowManager.nextDisplayRow(cell.row, true)

      if (nextRow) {
        nextRow.cells[index].getComponent().edit()
        return true
      }
    }

    return false
  }

  /**
   * Find next editable cell in a row after an index.
   * @param {object} row Internal row.
   * @param {number} index Start index.
   * @returns {object|boolean}
   */
  findNextEditableCell(row, index) {
    let nextCell = false

    if (index < row.cells.length - 1) {
      for (let i = index + 1; i < row.cells.length; i++) {
        const cell = row.cells[i]

        if (cell.column.modules.edit && Helpers.elVisible(cell.getElement())) {
          const allowEdit = this.allowEdit(cell)

          if (allowEdit) {
            nextCell = cell
            break
          }
        }
      }
    }

    return nextCell
  }

  /**
   * Find previous editable cell in a row before an index.
   * @param {object} row Internal row.
   * @param {number} index Start index.
   * @returns {object|boolean}
   */
  findPrevEditableCell(row, index) {
    let prevCell = false

    if (index > 0) {
      for (let i = index - 1; i >= 0; i--) {
        const cell = row.cells[i]

        if (cell.column.modules.edit && Helpers.elVisible(cell.getElement())) {
          const allowEdit = this.allowEdit(cell)

          if (allowEdit) {
            prevCell = cell
            break
          }
        }
      }
    }

    return prevCell
  }

  /// ////////////////////////////////
  /// ////// Internal Logic //////////
  /// ////////////////////////////////

  /**
   * Initialize column editing configuration when editor is defined.
   * @param {object} column Internal column.
   */
  initializeColumnCheck(column) {
    if (column.definition.editor !== undefined) {
      this.initializeColumn(column)
    }
  }

  /**
   * Cancel editing if the active column is deleted.
   * @param {object} column Internal column.
   */
  columnDeleteCheck(column) {
    if (this.currentCell && this.currentCell.column === column) {
      this.cancelEdit()
    }
  }

  /**
   * Cancel editing if the active row is deleted.
   * @param {object} row Internal row.
   */
  rowDeleteCheck(row) {
    if (this.currentCell && this.currentCell.row === row) {
      this.cancelEdit()
    }
  }

  /**
   * Re-evaluate editable state for all cells in a row.
   * @param {object} row Internal row.
   */
  rowEditableCheck(row) {
    row.getCells().forEach((cell) => {
      if (cell.column.modules.edit && typeof cell.column.modules.edit.check === 'function') {
        this.updateCellClass(cell)
      }
    })
  }

  // initialize column editor
  /**
   * Initialize edit module config for a column.
   * @param {object} column Internal column.
   */
  initializeColumn(column) {
    const convertEmpty = Object.keys(column.definition).includes('editorEmptyValue')

    const config = {
      editor: false,
      blocked: false,
      check: column.definition.editable,
      params: column.definition.editorParams || {},
      convertEmptyValues: convertEmpty,
      editorEmptyValue: column.definition.editorEmptyValue,
      editorEmptyValueFunc: column.definition.editorEmptyValueFunc
    }

    // set column editor
    config.editor = this.lookupEditor(column.definition.editor, column)

    if (config.editor) {
      column.modules.edit = config
    }
  }

  /**
   * Resolve editor definition into an editor function.
   * @param {string|Function|boolean} editor Editor definition.
   * @param {object} column Internal column.
   * @returns {Function|undefined}
   */
  lookupEditor(editor, column) {
    let editorFunc

    switch (typeof editor) {
      case 'string':
        if (this.editors[editor]) {
          editorFunc = this.editors[editor]
        } else {
          console.warn('Editor Error - No such editor found: ', editor)
        }
        break

      case 'function':
        editorFunc = editor
        break

      case 'boolean':
        if (editor === true) {
          if (typeof column.definition.formatter !== 'function') {
            if (this.editors[column.definition.formatter]) {
              editorFunc = this.editors[column.definition.formatter]
            } else {
              editorFunc = this.editors.input
            }
          } else {
            console.warn(
              'Editor Error - Cannot auto lookup editor for a custom formatter: ',
              column.definition.formatter
            )
          }
        }
        break
    }

    return editorFunc
  }

  /**
   * Get currently edited cell component.
   * @returns {object|boolean}
   */
  getCurrentCell() {
    return this.currentCell ? this.currentCell.getComponent() : false
  }

  /**
   * Clear active editor UI state.
   * @param {boolean} [cancel] Whether edit is being canceled.
   */
  clearEditor(cancel) {
    const cell = this.currentCell

    let cellEl

    this.invalidEdit = false

    if (cell) {
      this.currentCell = false

      cellEl = cell.getElement()

      this.dispatch('edit-editor-clear', cell, cancel)

      cellEl.classList.remove('tabulator-editing')
      cellEl.replaceChildren()

      cell.row.getElement().classList.remove('tabulator-editing')

      cell.table.element.classList.remove('tabulator-editing')
    }
  }

  /**
   * Cancel the active cell edit and restore value.
   */
  cancelEdit() {
    if (this.currentCell) {
      const cell = this.currentCell
      const component = this.currentCell.getComponent()

      this.clearEditor(true)
      cell.setValueActual(cell.getValue())
      cell.cellRendered()

      if (cell.column.definition.editor === 'textarea' || cell.column.definition.variableHeight) {
        cell.row.normalizeHeight(true)
      }

      if (cell.column.definition.cellEditCancelled) {
        cell.column.definition.cellEditCancelled.call(this.table, component)
      }

      this.dispatch('edit-cancelled', cell)
      this.dispatchExternal('cellEditCancelled', component)
    }
  }

  // return a formatted value for a cell
  /**
   * Bind edit trigger handlers to a cell element.
   * @param {object} cell Internal cell.
   */
  bindEditor(cell) {
    if (cell.column.modules.edit) {
      const element = cell.getElement(true)

      this.updateCellClass(cell)
      element.setAttribute('tabindex', 0)

      element.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
          e.preventDefault()
        } else {
          this.mouseClick = true
        }
      })

      if (this.options('editTriggerEvent') === 'dblclick') {
        element.addEventListener('dblclick', (e) => {
          if (!element.classList.contains('tabulator-editing')) {
            element.focus({ preventScroll: true })
            this.edit(cell, e, false)
          }
        })
      }

      if (this.options('editTriggerEvent') === 'focus' || this.options('editTriggerEvent') === 'click') {
        element.addEventListener('click', (e) => {
          if (!element.classList.contains('tabulator-editing')) {
            element.focus({ preventScroll: true })
            this.edit(cell, e, false)
          }
        })
      }

      if (this.options('editTriggerEvent') === 'focus') {
        element.addEventListener('focus', (e) => {
          if (!this.recursionBlock) {
            this.edit(cell, e, false)
          }
        })
      }
    }
  }

  /**
   * Focus a cell element without triggering recursion.
   * @param {object} cell Internal cell.
   * @param {boolean} [block] Block focus in IE scenarios.
   */
  focusCellNoEvent(cell, block) {
    this.recursionBlock = true

    if (!(block && this.table.browser === 'ie')) {
      cell.getElement().focus({ preventScroll: true })
    }

    this.recursionBlock = false
  }

  /**
   * Programmatically start editing a cell.
   * @param {object} cell Internal cell.
   * @param {boolean} [forceEdit] Force edit even if not editable.
   */
  editCell(cell, forceEdit) {
    this.focusCellNoEvent(cell)
    this.edit(cell, false, forceEdit)
  }

  /**
   * Ensure the editing cell is visible in virtual render mode.
   * @param {object} cell Internal cell.
   */
  focusScrollAdjust(cell) {
    if (this.table.rowManager.getRenderMode() === 'virtual') {
      const topEdge = this.table.rowManager.element.scrollTop
      const bottomEdge = this.table.rowManager.element.clientHeight + this.table.rowManager.element.scrollTop
      const rowEl = cell.row.getElement()

      if (rowEl.offsetTop < topEdge) {
        this.table.rowManager.element.scrollTop -= topEdge - rowEl.offsetTop
      } else {
        if (rowEl.offsetTop + rowEl.offsetHeight > bottomEdge) {
          this.table.rowManager.element.scrollTop += rowEl.offsetTop + rowEl.offsetHeight - bottomEdge
        }
      }

      let leftEdge = this.table.rowManager.element.scrollLeft
      let rightEdge = this.table.rowManager.element.clientWidth + this.table.rowManager.element.scrollLeft
      const cellEl = cell.getElement()

      if (this.table.modExists('frozenColumns')) {
        leftEdge += Number.parseInt(this.table.modules.frozenColumns.leftMargin || 0, 10)
        rightEdge -= Number.parseInt(this.table.modules.frozenColumns.rightMargin || 0, 10)
      }

      if (this.table.options.renderHorizontal === 'virtual') {
        leftEdge -= Number.parseInt(this.table.columnManager.renderer.vDomPadLeft, 10)
        rightEdge -= Number.parseInt(this.table.columnManager.renderer.vDomPadLeft, 10)
      }

      if (cellEl.offsetLeft < leftEdge) {
        this.table.rowManager.element.scrollLeft -= leftEdge - cellEl.offsetLeft
      } else {
        if (cellEl.offsetLeft + cellEl.offsetWidth > rightEdge) {
          this.table.rowManager.element.scrollLeft += cellEl.offsetLeft + cellEl.offsetWidth - rightEdge
        }
      }
    }
  }

  /**
   * Determine if a cell is currently editable.
   * @param {object} cell Internal cell.
   * @returns {boolean}
   */
  allowEdit(cell) {
    let check = !!cell.column.modules.edit

    if (cell.column.modules.edit) {
      switch (typeof cell.column.modules.edit.check) {
        case 'function':
          if (cell.row.initialized) {
            check = cell.column.modules.edit.check(cell.getComponent())
          }
          break

        case 'string':
          check = !!cell.row.data[cell.column.modules.edit.check]
          break

        case 'boolean':
          check = cell.column.modules.edit.check
          break
      }
    }

    return check
  }

  /**
   * Open cell editor and manage edit lifecycle callbacks.
   * @param {object} cell Internal cell.
   * @param {Event|boolean} e Trigger event.
   * @param {boolean} forceEdit Force edit for non-editable cells.
   * @returns {boolean|undefined}
   */
  edit(cell, e, forceEdit) {
    const element = cell.getElement()
    const editModule = cell.column.modules.edit

    let allowEdit
    let rendered = () => {}
    let editFinished = false
    let cellEditor
    let component
    let params

    // prevent editing if another cell is refusing to leave focus (eg. validation fail)

    if (this.currentCell) {
      if (!this.invalidEdit && this.currentCell !== cell) {
        this.cancelEdit()
      }
      return
    }

    // handle successful value change
    const success = (value) => {
      if (this.currentCell === cell && !editFinished) {
        const valid = this.chain('edit-success', [cell, value], true, true)

        if (valid === true || this.table.options.validationMode === 'highlight') {
          editFinished = true

          this.clearEditor()

          if (!cell.modules.edit) {
            cell.modules.edit = {}
          }

          cell.modules.edit.edited = true

          if (!this.editedCells.includes(cell)) {
            this.editedCells.push(cell)
          }

          value = this.transformEmptyValues(value, cell)

          cell.setValue(value, true)

          return valid === true
        } else {
          editFinished = true
          this.invalidEdit = true
          this.focusCellNoEvent(cell, true)
          rendered()

          setTimeout(() => {
            editFinished = false
          }, 10)
          return false
        }
      } else {
        // console.warn("Edit Success Error - cannot call success on a cell that is no longer being edited");
      }
    }

    // handle aborted edit
    const cancel = () => {
      // editFinished = true;

      if (this.currentCell === cell && !editFinished) {
        this.cancelEdit()
      } else {
        // console.warn("Edit Success Error - cannot call cancel on a cell that is no longer being edited");
      }
    }

    const onRendered = (callback) => {
      rendered = callback
    }

    if (editModule && !editModule.blocked) {
      if (e) {
        e.stopPropagation()
      }

      allowEdit = this.allowEdit(cell)

      if (allowEdit || forceEdit) {
        this.cancelEdit()

        this.currentCell = cell

        this.focusScrollAdjust(cell)

        component = cell.getComponent()

        if (this.mouseClick) {
          this.mouseClick = false

          if (cell.column.definition.cellClick) {
            cell.column.definition.cellClick.call(this.table, e, component)
          }
        }

        if (cell.column.definition.cellEditing) {
          cell.column.definition.cellEditing.call(this.table, component)
        }

        this.dispatch('cell-editing', cell)
        this.dispatchExternal('cellEditing', component)

        params = typeof editModule.params === 'function' ? editModule.params(component) : editModule.params

        cellEditor = editModule.editor.call(this, component, onRendered, success, cancel, params)

        // if editor returned, add to DOM, if false, abort edit
        if (this.currentCell && cellEditor !== false) {
          if (cellEditor instanceof Node) {
            element.classList.add('tabulator-editing')
            cell.row.getElement().classList.add('tabulator-editing')
            cell.table.element.classList.add('tabulator-editing')
            element.replaceChildren()
            element.appendChild(cellEditor)

            // trigger onRendered Callback
            rendered()

            // prevent editing from triggering rowClick event
            const children = element.children

            for (let i = 0; i < children.length; i++) {
              children[i].addEventListener('click', (e) => {
                e.stopPropagation()
              })
            }
          } else {
            console.warn('Edit Error - Editor should return an instance of Node, the editor returned:', cellEditor)
            this.blur(element)
            return false
          }
        } else {
          this.blur(element)
          return false
        }

        return true
      } else {
        this.mouseClick = false
        this.blur(element)
        return false
      }
    } else {
      this.mouseClick = false
      this.blur(element)
      return false
    }
  }

  /**
   * Default empty-value check for editor values.
   * @param {*} value Editor value.
   * @returns {boolean}
   */
  emptyValueCheck(value) {
    return value === '' || value == null
  }

  /**
   * Convert configured empty editor values.
   * @param {*} value Editor value.
   * @param {object} cell Internal cell.
   * @returns {*}
   */
  transformEmptyValues(value, cell) {
    const mod = cell.column.modules.edit
    const convert = mod.convertEmptyValues || this.convertEmptyValues

    let checkFunc

    if (convert) {
      checkFunc = mod.editorEmptyValueFunc || this.options('editorEmptyValueFunc')

      if (checkFunc && checkFunc(value)) {
        value = mod.convertEmptyValues ? mod.editorEmptyValue : this.options('editorEmptyValue')
      }
    }

    return value
  }

  /**
   * Blur an element unless blur is canceled by listeners.
   * @param {HTMLElement} element Target element.
   */
  blur(element) {
    if (!this.confirm('edit-blur', [element])) {
      element.blur()
    }
  }

  /**
   * Get all edited cell components.
   * @returns {Array<object>}
   */
  getEditedCells() {
    return this.editedCells.map((cell) => cell.getComponent())
  }

  /**
   * Clear edited state tracking for a cell.
   * @param {object} cell Internal cell.
   */
  clearEdited(cell) {
    let editIndex

    if (cell.modules.edit && cell.modules.edit.edited) {
      cell.modules.edit.edited = false

      this.dispatch('edit-edited-clear', cell)
    }

    editIndex = this.editedCells.indexOf(cell)

    if (editIndex > -1) {
      this.editedCells.splice(editIndex, 1)
    }
  }
}
