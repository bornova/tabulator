import { expect, test } from '@playwright/test'
import { defineModuleSpec } from '../moduleSmokeUtils.js'

defineModuleSpec(test, expect, 'responsiveLayout', {
  tableOptions: {
    responsiveLayout: 'collapse',
    columns: [
      { formatter: 'responsiveCollapse', width: 40, hozAlign: 'center', headerSort: false },
      { title: 'ID', field: 'id', width: 180, responsive: 0 },
      { title: 'Name', field: 'name', width: 220, responsive: 1 },
      { title: 'Age', field: 'age', width: 220, responsive: 2 },
      { title: 'Group', field: 'group', width: 220, responsive: 3 }
    ]
  },
  selectors: ['.tabulator-responsive-collapse-toggle']
})
