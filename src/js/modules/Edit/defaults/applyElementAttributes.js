/**
 * Apply custom element attributes from editorParams to a DOM element.
 * Keys prefixed with '+' append to the existing attribute value.
 *
 * @param {HTMLElement} element Target DOM element.
 * @param {object} elementAttributes Attribute map from editorParams.
 */
export default function applyElementAttributes(element, elementAttributes) {
  if (elementAttributes && typeof elementAttributes === 'object') {
    for (let key in elementAttributes) {
      if (key.charAt(0) === '+') {
        key = key.slice(1)
        element.setAttribute(key, (element.getAttribute(key) || '') + elementAttributes[`+${key}`])
      } else {
        element.setAttribute(key, elementAttributes[key])
      }
    }
  }
}
