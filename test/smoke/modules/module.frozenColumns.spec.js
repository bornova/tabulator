import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'frozenColumns', {
  tableOptions: {
    columns: [
      { title: 'ID', field: 'id', frozen: true },
      { title: 'Name', field: 'name' },
      { title: 'Age', field: 'age' }
    ]
  },
  selectors: ['.tabulator-frozen']
})
