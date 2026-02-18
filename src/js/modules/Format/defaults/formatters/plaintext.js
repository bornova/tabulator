/**
 * Render sanitized plain text.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {Object} formatterParams Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {string} Sanitized plain text value.
 */
export default function (cell, formatterParams, onRendered) {
  const value = this.sanitizeHTML(cell.getValue())

  return this.emptyToSpace(value)
}
