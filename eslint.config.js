import globals from 'globals'
import js from '@eslint/js'

export default [
  // Ignore build and dist directories
  { ignores: ['dist', 'examples', 'test'] },
  // Use recommended ESLint configurations
  js.configs.recommended,
  {
    languageOptions: {
      // Use the latest ECMAScript version
      ecmaVersion: 'latest',
      // Define global variables
      globals: { numara: 'readonly', ...globals.browser, ...globals.node, luxon: 'readonly' },
      // Set the source type to module
      sourceType: 'module'
    }
  }
]
