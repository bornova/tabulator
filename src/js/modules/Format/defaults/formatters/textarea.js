/**
 * Render multi-line plain text.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {Object} formatterParams Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {string} Sanitized text.
 */
export default function (cell, formatterParams, onRendered) {
  void formatterParams
  void onRendered
  const element = cell.getElement()

  element.style.whiteSpace = 'pre-wrap'
  return this.emptyToSpace(this.sanitizeHTML(cell.getValue()))
}
