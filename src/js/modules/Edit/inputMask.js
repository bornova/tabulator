/**
 * Apply an input mask to an input element.
 *
 * @param {HTMLInputElement} el Input element.
 * @param {{mask: string, maskLetterChar?: string, maskNumberChar?: string, maskWildcardChar?: string, maskAutoFill?: boolean}} options Mask options.
 * @returns {void}
 */
export default function maskInput(el, options) {
  const mask = options.mask

  if (!mask) {
    return
  }

  const maskLetter = options.maskLetterChar ?? 'A'
  const maskNumber = options.maskNumberChar ?? '9'
  const maskWildcard = options.maskWildcardChar ?? '*'

  function fillSymbols(index) {
    const symbol = mask[index]
    if (symbol !== undefined && symbol !== maskWildcard && symbol !== maskLetter && symbol !== maskNumber) {
      el.value = `${el.value}${symbol}`
      fillSymbols(index + 1)
    }
  }

  el.addEventListener('keydown', (e) => {
    const index = el.value.length
    const char = e.key
    const isInputCharacter = char && char.length === 1

    if (isInputCharacter && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (index >= mask.length) {
        e.preventDefault()
        e.stopPropagation()
        return false
      } else {
        switch (mask[index]) {
          case maskLetter:
            if (char.toUpperCase() === char.toLowerCase()) {
              e.preventDefault()
              e.stopPropagation()
              return false
            }
            break

          case maskNumber:
            if (Number.isNaN(Number.parseFloat(char))) {
              e.preventDefault()
              e.stopPropagation()
              return false
            }
            break

          case maskWildcard:
            break

          default:
            if (char !== mask[index]) {
              e.preventDefault()
              e.stopPropagation()
              return false
            }
        }
      }
    }
  })

  el.addEventListener('keyup', (e) => {
    if (e.key && e.key.length === 1) {
      if (options.maskAutoFill) {
        fillSymbols(el.value.length)
      }
    }
  })

  if (!el.placeholder) {
    el.placeholder = mask
  }

  if (options.maskAutoFill) {
    fillSymbols(el.value.length)
  }
}
