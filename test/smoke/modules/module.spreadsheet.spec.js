import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'spreadsheet', {
  tableOptions: {
    data: false,
    columns: [],
    spreadsheet: true,
    spreadsheetRows: 3,
    spreadsheetColumns: 3,
    spreadsheetData: [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ]
  },
  apiFunctions: ['getSheets']
})
