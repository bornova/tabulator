import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'groupRows', {
  tableOptions: {
    groupBy: 'group'
  },
  selectors: ['.tabulator-group']
})
