import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'dataTree', {
  tableOptions: {
    dataTree: true,
    data: [
      {
        id: 1,
        name: 'Root',
        _children: [
          { id: 2, name: 'Child 1' },
          { id: 3, name: 'Child 2' }
        ]
      }
    ],
    columns: [{ title: 'Name', field: 'name' }]
  },
  selectors: ['.tabulator-data-tree-control']
})
