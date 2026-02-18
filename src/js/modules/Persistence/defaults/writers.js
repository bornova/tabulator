// write persistence information to storage
export default {
  local(id, type, data) {
    localStorage.setItem(`${id}-${type}`, JSON.stringify(data))
  },
  cookie(id, type, data) {
    const expireDate = new Date()

    expireDate.setDate(expireDate.getDate() + 10000)

    document.cookie = `${id}-${type}=${JSON.stringify(data)}; expires=${expireDate.toUTCString()}`
  }
}
