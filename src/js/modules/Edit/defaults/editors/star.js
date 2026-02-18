// star rating
export default function (cell, onRendered, success, cancel, editorParams) {
  const element = cell.getElement()
  let value = cell.getValue()
  const maxStars = element.getElementsByTagName('svg').length || 5
  const size = element.getElementsByTagName('svg')[0]
    ? element.getElementsByTagName('svg')[0].getAttribute('width')
    : 14
  const stars = []
  const starsHolder = document.createElement('div')
  const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const isIE = this.table.browser === 'ie'

  // change star type
  function starChange(val) {
    stars.forEach((star, i) => {
      if (i < val) {
        if (isIE) {
          star.setAttribute('class', 'tabulator-star-active')
        } else {
          star.classList.replace('tabulator-star-inactive', 'tabulator-star-active')
        }

        star.innerHTML =
          '<polygon fill="#488CE9" stroke="#014AAE" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>'
      } else {
        if (isIE) {
          star.setAttribute('class', 'tabulator-star-inactive')
        } else {
          star.classList.replace('tabulator-star-active', 'tabulator-star-inactive')
        }

        star.innerHTML =
          '<polygon fill="#010155" stroke="#686868" stroke-width="37.6152" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="259.216,29.942 330.27,173.919 489.16,197.007 374.185,309.08 401.33,467.31 259.216,392.612 117.104,467.31 144.25,309.08 29.274,197.007 188.165,173.919 "/>'
      }
    })
  }

  // build stars
  function buildStar(i) {
    const starHolder = document.createElement('span')
    const nextStar = star.cloneNode(true)

    stars.push(nextStar)

    starHolder.addEventListener('mouseenter', (e) => {
      e.stopPropagation()
      e.stopImmediatePropagation()
      starChange(i)
    })

    starHolder.addEventListener('mousemove', (e) => {
      e.stopPropagation()
      e.stopImmediatePropagation()
    })

    starHolder.addEventListener('click', (e) => {
      e.stopPropagation()
      e.stopImmediatePropagation()
      success(i)
      element.blur()
    })

    starHolder.appendChild(nextStar)
    starsHolder.appendChild(starHolder)
  }

  // handle keyboard navigation value change
  function changeValue(val) {
    value = val
    starChange(val)
  }

  // style cell
  element.style.whiteSpace = 'nowrap'
  element.style.overflow = 'hidden'
  element.style.textOverflow = 'ellipsis'

  // style holding element
  starsHolder.style.verticalAlign = 'middle'
  starsHolder.style.display = 'inline-block'
  starsHolder.style.padding = '4px'

  // style star
  star.setAttribute('width', size)
  star.setAttribute('height', size)
  star.setAttribute('viewBox', '0 0 512 512')
  star.setAttribute('xml:space', 'preserve')
  star.style.padding = '0 1px'

  if (editorParams.elementAttributes && typeof editorParams.elementAttributes === 'object') {
    for (let key in editorParams.elementAttributes) {
      if (key.charAt(0) === '+') {
        key = key.slice(1)
        starsHolder.setAttribute(key, starsHolder.getAttribute(key) + editorParams.elementAttributes[`+${key}`])
      } else {
        starsHolder.setAttribute(key, editorParams.elementAttributes[key])
      }
    }
  }

  // create correct number of stars
  for (let i = 1; i <= maxStars; i++) {
    buildStar(i)
  }

  // ensure value does not exceed number of stars
  value = Math.min(Number.parseInt(value, 10), maxStars)

  // set initial styling of stars
  starChange(value)

  starsHolder.addEventListener('mousemove', (e) => {
    starChange(0)
  })

  starsHolder.addEventListener('click', (e) => {
    success(0)
  })

  element.addEventListener('blur', (e) => {
    cancel()
  })

  // allow key based navigation
  element.addEventListener('keydown', (e) => {
    switch (e.keyCode) {
      case 39: // right arrow
        changeValue(value + 1)
        break

      case 37: // left arrow
        changeValue(value - 1)
        break

      case 13: // enter
        success(value)
        break

      case 27: // escape
        cancel()
        break
    }
  })

  return starsHolder
}
