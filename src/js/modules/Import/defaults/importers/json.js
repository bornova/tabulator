export default function (input) {
  try {
    return JSON.parse(input)
  } catch (error) {
    console.warn('JSON Import Error - File contents is invalid JSON', error)
    return Promise.reject(error)
  }
}
