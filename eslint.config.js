import globals from 'globals'
import js from '@eslint/js'

export default [
  { ignores: ['dist', 'examples', 'test'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { numara: 'readonly', ...globals.browser, ...globals.node, luxon: 'readonly' },
      sourceType: 'module'
    }
  }
]
