import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', '**/*.sw.js', '**/workbox-*.js']),
  // Frontend (browser) linter config for all JS/JSX EXCEPT functions/
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['functions/**'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // Node.js config for Firebase Functions
  {
    files: ['functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      globals: globals.node,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'script', // Use 'script' for CommonJS
      },
    },
    rules: {
      // add backend-specific lint rules here if needed
    },
  }
])
