import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'frozenRows', {
  tableOptions: {
    frozenRows: 1
  },
  selectors: ['.tabulator-frozen-rows-holder']
})
