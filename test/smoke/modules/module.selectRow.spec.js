import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'selectRow', {
  tableOptions: {
    selectableRows: true
  },
  apiFunctions: ['selectRow']
})
