export default function maskInput(el, options) {
  const mask = options.mask
  const maskLetter = typeof options.maskLetterChar !== 'undefined' ? options.maskLetterChar : 'A'
  const maskNumber = typeof options.maskNumberChar !== 'undefined' ? options.maskNumberChar : '9'
  const maskWildcard = typeof options.maskWildcardChar !== 'undefined' ? options.maskWildcardChar : '*'

  function fillSymbols(index) {
    const symbol = mask[index]
    if (typeof symbol !== 'undefined' && symbol !== maskWildcard && symbol !== maskLetter && symbol !== maskNumber) {
      el.value = el.value + '' + symbol
      fillSymbols(index + 1)
    }
  }

  el.addEventListener('keydown', (e) => {
    const index = el.value.length
    const char = e.key

    if (e.keyCode > 46 && !e.ctrlKey && !e.metaKey) {
      if (index >= mask.length) {
        e.preventDefault()
        e.stopPropagation()
        return false
      } else {
        switch (mask[index]) {
          case maskLetter:
            if (char.toUpperCase() == char.toLowerCase()) {
              e.preventDefault()
              e.stopPropagation()
              return false
            }
            break

          case maskNumber:
            if (isNaN(char)) {
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
    if (e.keyCode > 46) {
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
