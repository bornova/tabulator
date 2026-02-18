export const baseConfig = {
  layout: 'fitDataFill',
  height: 600
}

export const baseColumns = [
  { title: 'Id', field: 'id', headerSortTristate: true },
  { title: 'Name', field: 'name', sorter: 'string' },
  { title: 'Age', field: 'age', sorter: 'number', hozAlign: 'right' },
  { title: 'Gender', field: 'gender', sorter: 'string' },
  { title: 'Rating', field: 'rating', formatter: 'star', hozAlign: 'center' },
  { title: 'Color', field: 'col', sorter: 'string' },
  { title: 'DoB', field: 'dob', sorter: 'date', hozAlign: 'center' },
  {
    title: 'Car',
    field: 'car',
    sorter: 'boolean',
    hozAlign: 'center',
    formatter: 'toggle',
    formatterParams: {
      size: 10,
      onValue: 'on',
      offValue: 'off',
      clickable: true
    }
  }
]

export const groupedColumns = [
  { ...baseColumns[0], frozen: true },
  { ...baseColumns[1] },
  {
    title: 'Work Info',
    columns: [{ ...baseColumns[2] }, { ...baseColumns[3] }, { ...baseColumns[4] }]
  },
  {
    title: 'Personal Info',
    columns: [{ ...baseColumns[5] }, { ...baseColumns[6] }, { ...baseColumns[7] }]
  }
]

export const calculatedColumns = [
  { ...baseColumns[0] },
  { ...baseColumns[1] },
  { ...baseColumns[2] },
  { ...baseColumns[3] },
  { ...baseColumns[4] },
  { ...baseColumns[5] },
  { ...baseColumns[6] },
  { ...baseColumns[7] }
]

export const editableColumns = [
  { ...baseColumns[0] },
  {
    ...baseColumns[1],
    editor: 'list',
    editorParams: { valuesLookup: 'active', clearable: true, autocomplete: true },
    headerFilter: 'input'
  },
  { ...baseColumns[2], editor: 'number', bottomCalc: 'avg', topCalc: 'max' },
  { ...baseColumns[3], editor: 'list', editorParams: { valuesLookup: 'active', clearable: true, autocomplete: true } },
  { ...baseColumns[4] },
  { ...baseColumns[5] },
  { ...baseColumns[6], editor: 'datetime' },
  { ...baseColumns[7] }
]

export const paginationConfig = {
  pagination: 'local',
  paginationSize: 20,
  paginationSizeSelector: [5, 10, 20, 50, 100]
}

export const groupConfig = {
  groupBy: 'gender',
  groupHeader: function (value, count, data, group) {
    return value + ' (' + count + ' items)'
  }
}
