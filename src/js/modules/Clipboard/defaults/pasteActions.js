export default {
  replace(data) {
    return this.table.setData(data)
  },
  update(data) {
    return this.table.updateOrAddData(data)
  },
  insert(data) {
    return this.table.addData(data)
  }
}
