import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'tooltip', {
  tableOptions: {
    columns: [
      { title: 'ID', field: 'id' },
      { title: 'Name', field: 'name', tooltip: true }
    ]
  }
})
