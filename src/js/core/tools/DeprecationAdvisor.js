import CoreFeature from '../CoreFeature.js'

export default class DeprecationAdvisor extends CoreFeature {
  /**
   * @param {object} table Tabulator table instance.
   */
  constructor(table) {
    super(table)
  }

  /**
   * Warn in debug mode when deprecation warnings are enabled.
   * @param {...*} args Console warning arguments.
   * @returns {void}
   */
  _warnUser(...args) {
    if (this.options('debugDeprecation')) {
      console.warn(...args)
    }
  }

  /**
   * Check an old option and optionally map it to a replacement.
   * @param {string} oldOption Deprecated option key.
   * @param {string} [newOption] Replacement option key.
   * @param {boolean} [convert] Copy old option value to new option.
   * @returns {boolean}
   */
  check(oldOption, newOption, convert) {
    let msg

    if (this.options(oldOption) !== undefined) {
      msg = 'Deprecated Setup Option - Use of the %c' + oldOption + '%c option is now deprecated'

      if (newOption) {
        msg = msg + ', Please use the %c' + newOption + '%c option instead'
        this._warnUser(msg, 'font-weight: bold;', 'font-weight: normal;', 'font-weight: bold;', 'font-weight: normal;')

        if (convert) {
          this.table.options[newOption] = this.table.options[oldOption]
        }
      } else {
        this._warnUser(msg, 'font-weight: bold;', 'font-weight: normal;')
      }

      return false
    } else {
      return true
    }
  }

  /**
   * Check an old option and emit a custom deprecation message.
   * @param {string} oldOption Deprecated option key.
   * @param {string} msg Additional warning message.
   * @returns {boolean}
   */
  checkMsg(oldOption, msg) {
    if (this.options(oldOption) !== undefined) {
      this._warnUser(
        '%cDeprecated Setup Option - Use of the %c' + oldOption + ' %c option is now deprecated, ' + msg,
        'font-weight: normal;',
        'font-weight: bold;',
        'font-weight: normal;'
      )

      return false
    } else {
      return true
    }
  }

  /**
   * Emit a deprecation message in debug mode.
   * @param {string} msg Warning message.
   * @returns {void}
   */
  msg(msg) {
    this._warnUser(msg)
  }
}
