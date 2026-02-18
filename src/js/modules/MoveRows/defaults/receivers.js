export default {
  insert(fromRow, toRow, fromTable) {
    this.table.addRow(fromRow.getData(), undefined, toRow)

    return true
  },

  add(fromRow, toRow, fromTable) {
    this.table.addRow(fromRow.getData())

    return true
  },

  update(fromRow, toRow, fromTable) {
    if (!toRow) {
      return false
    }

    toRow.update(fromRow.getData())

    return true
  },

  replace(fromRow, toRow, fromTable) {
    if (!toRow) {
      return false
    }

    this.table.addRow(fromRow.getData(), undefined, toRow)
    toRow.delete()

    return true
  }
}
