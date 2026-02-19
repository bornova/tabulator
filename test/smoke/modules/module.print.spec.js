import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'print', {
  apiFunctions: ['print']
})
