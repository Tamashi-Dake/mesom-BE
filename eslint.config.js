import eslintPluginPrettier from 'eslint-plugin-prettier'

import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  // {
  //   files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
  //   plugins: { js },
  //   extends: ['js/recommended']
  // },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: { ...globals.node } }
  },
  tseslint.configs.recommended,
  {
    plugins: {
      prettier: eslintPluginPrettier
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'prettier/prettier': [
        'warn',
        {
          arrowParens: 'always',
          semi: false,
          trailingComma: 'none',
          tabWidth: 2,
          endOfLine: 'auto',
          useTabs: false,
          singleQuote: true,
          printWidth: 120,
          jsxSingleQuote: true
        }
      ]
    },
    ignores: [
      '**/node_modules/*',
      '**/dist/*'
      //  '**/*.js'
    ]
  }
])
