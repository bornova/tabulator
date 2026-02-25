import CellComponent from '../../../../core/cell/CellComponent.js'

/**
 * Render a progress bar formatter.
 *
 * @this {Object}
 * @param {Object} cell Cell component.
 * @param {Object} [formatterParams={}] Formatter parameters.
 * @param {function(function): void} onRendered Render callback registrar.
 * @returns {string} Empty string.
 */
export default function (cell, formatterParams = {}, onRendered) {
  // progress bar
  const value = this.sanitizeHTML(cell.getValue()) || 0
  let element = cell.getElement()
  const max = formatterParams.max ?? 100
  const min = formatterParams.min ?? 0
  const legendAlign = formatterParams.legendAlign ? formatterParams.legendAlign : 'center'
  let percentValue
  let color
  let legend
  let legendColor
  let legendEl

  // make sure value is in range
  const parsedValue = parseFloat(value)
  percentValue = parsedValue <= max ? parsedValue : max
  percentValue = parseFloat(percentValue) >= min ? parseFloat(percentValue) : min

  // workout percentage
  const percent = (max - min) / 100
  percentValue = Math.round((percentValue - min) / percent)

  // set bar color
  switch (typeof formatterParams.color) {
    case 'string':
      color = formatterParams.color
      break
    case 'function':
      color = formatterParams.color(value)
      break
    case 'object':
      if (Array.isArray(formatterParams.color)) {
        const unit = 100 / formatterParams.color.length
        let index = Math.floor(percentValue / unit)

        index = Math.min(index, formatterParams.color.length - 1)
        index = Math.max(index, 0)
        color = formatterParams.color[index]
        break
      }
    // falls through
    default:
      color = '#2DC214'
  }

  // generate legend
  switch (typeof formatterParams.legend) {
    case 'string':
      legend = formatterParams.legend
      break
    case 'function':
      legend = formatterParams.legend(value)
      break
    case 'boolean':
      legend = value
      break
    default:
      legend = false
  }

  // set legend color
  switch (typeof formatterParams.legendColor) {
    case 'string':
      legendColor = formatterParams.legendColor
      break
    case 'function':
      legendColor = formatterParams.legendColor(value)
      break
    case 'object':
      if (Array.isArray(formatterParams.legendColor)) {
        const unit = 100 / formatterParams.legendColor.length
        let index = Math.floor(percentValue / unit)

        index = Math.min(index, formatterParams.legendColor.length - 1)
        index = Math.max(index, 0)
        legendColor = formatterParams.legendColor[index]
      }
      break
    default:
      legendColor = '#000'
  }

  element.classList.add('tabulator-progress-formatter')

  element.setAttribute('aria-label', percentValue)

  const barEl = document.createElement('div')
  barEl.classList.add('tabulator-progress-formatter-bar')
  barEl.style.width = `${percentValue}%`
  barEl.style.backgroundColor = color

  barEl.setAttribute('data-max', max)
  barEl.setAttribute('data-min', min)

  const barContainer = document.createElement('div')
  barContainer.classList.add('tabulator-progress-formatter-container')

  if (legend) {
    legendEl = document.createElement('div')
    legendEl.classList.add('tabulator-progress-formatter-legend')
    legendEl.style.textAlign = legendAlign
    legendEl.style.color = legendColor
    legendEl.innerHTML = legend
  }

  onRendered(() => {
    // handle custom element needed if formatter is to be included in printed/downloaded output
    if (!(cell instanceof CellComponent)) {
      const holderEl = document.createElement('div')
      holderEl.classList.add('tabulator-progress-formatter-holder')

      element.appendChild(holderEl)

      element = holderEl
    }

    element.appendChild(barContainer)
    barContainer.appendChild(barEl)

    if (legend) {
      barContainer.appendChild(legendEl)
    }
  })

  return ''
}
