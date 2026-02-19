import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'resizeRows', {
  tableOptions: {
    resizableRows: true
  }
})
