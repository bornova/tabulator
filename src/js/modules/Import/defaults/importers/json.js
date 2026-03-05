/**
 * Parse JSON input into row data.
 *
 * @param {string} input JSON input text.
 * @returns {Array<Object>|Promise<never>} Parsed data or rejected promise when invalid.
 */
export default function (input) {
  if (typeof input !== 'string') {
    return input
  }

  try {
    return JSON.parse(input)
  } catch (error) {
    console.warn('JSON Import Error - File contents is invalid JSON', error)
    return Promise.reject(error)
  }
}
