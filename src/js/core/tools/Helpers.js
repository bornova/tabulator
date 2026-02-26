export default class Helpers {
  /**
   * Check whether an element has a visible box.
   * @param {HTMLElement} el Target element.
   * @returns {boolean}
   */
  static elVisible(el) {
    return !(el.offsetWidth <= 0 && el.offsetHeight <= 0)
  }

  /**
   * Get page-offset coordinates for an element.
   * @param {HTMLElement} el Target element.
   * @returns {{top:number,left:number}}
   */
  static elOffset(el) {
    const box = el.getBoundingClientRect()

    return {
      top: box.top + window.pageYOffset - document.documentElement.clientTop,
      left: box.left + window.pageXOffset - document.documentElement.clientLeft
    }
  }

  /**
   * Retrieve nested data from an object using a delimited field path.
   * @param {string} separator Nested field separator.
   * @param {string} field Field path.
   * @param {object} data Source object.
   * @returns {*}
   */
  static retrieveNestedData(separator, field, data) {
    const structure = separator ? field.split(separator) : [field]
    const length = structure.length

    let output

    for (let i = 0; i < length; i++) {
      if (data == null) {
        output = data
        break
      }

      data = data[structure[i]]

      output = data

      if (!data) {
        break
      }
    }

    return output
  }

  /**
   * Deep clone plain objects/arrays with circular reference handling.
   * @param {object|Array<*>} obj Source value.
   * @param {object|Array<*>} [clone] Existing clone target.
   * @param {Array<object>} [list=[]] Internal reference map.
   * @returns {object|Array<*>}
   */
  static deepClone(obj, clone, list = []) {
    const objectProto = {}.__proto__
    const arrayProto = [].__proto__

    if (!clone) {
      clone = Object.assign(Array.isArray(obj) ? [] : {}, obj)
    }

    for (const i in obj) {
      const subject = obj[i]

      let match
      let copy

      if (
        subject != null &&
        typeof subject === 'object' &&
        (subject.__proto__ === objectProto || subject.__proto__ === arrayProto)
      ) {
        match = list.findIndex((item) => item.subject === subject)

        if (match > -1) {
          clone[i] = list[match].copy
        } else {
          copy = Object.assign(Array.isArray(subject) ? [] : {}, subject)

          list.unshift({ subject, copy })

          clone[i] = this.deepClone(subject, copy, list)
        }
      }
    }

    return clone
  }
}
