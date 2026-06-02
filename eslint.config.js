import globals from 'globals'
import js from '@eslint/js'

export default [
  { ignores: ['dist', 'docs'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.browser, ...globals.node, Tabulator: 'readonly' },
      sourceType: 'module'
    }
  }
]
