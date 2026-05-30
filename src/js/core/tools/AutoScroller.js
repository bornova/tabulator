import CoreFeature from '../CoreFeature'

export default class AutoScroller extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)
    this.animationFrame = null
    this.scrolling = false
    this.container = null
    this.direction = null
    this.step = 5
  }

  /**
   * Start auto-scroll on a target container in a given direction.
   * @param {HTMLElement} container Target scroll container.
   * @param {string} direction Scroll direction: 'left', 'right', 'up', 'down'.
   * @param {number} [step=5] Scroll step size in pixels.
   */
  start(container, direction, step = 5) {
    if (this.scrolling) {
      if (this.container === container && this.direction === direction) {
        this.step = step
        return
      }
      this.stop()
    }

    this.scrolling = true
    this.container = container
    this.direction = direction
    this.step = step

    const scroll = () => {
      if (!this.scrolling) {
        return
      }

      if (this.direction === 'left') {
        this.container.scrollLeft = Math.max(0, this.container.scrollLeft - this.step)
      } else if (this.direction === 'right') {
        const maxScroll = this.container.scrollWidth - this.container.clientWidth
        this.container.scrollLeft = Math.min(maxScroll, this.container.scrollLeft + this.step)
      } else if (this.direction === 'up') {
        this.container.scrollTop = Math.max(0, this.container.scrollTop - this.step)
      } else if (this.direction === 'down') {
        const maxScroll = this.container.scrollHeight - this.container.clientHeight
        this.container.scrollTop = Math.min(maxScroll, this.container.scrollTop + this.step)
      }

      this.animationFrame = requestAnimationFrame(scroll)
    }

    this.animationFrame = requestAnimationFrame(scroll)
  }

  /**
   * Stop active auto-scroll animation loop.
   */
  stop() {
    this.scrolling = false
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    this.container = null
    this.direction = null
  }
}
