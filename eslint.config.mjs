import appiumConfig from '@appium/eslint-config-appium-ts';
import eslintReact from '@eslint-react/eslint-plugin';
import {defineConfig, globalIgnores} from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        document: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSortPlugin,
    },
    extends: [appiumConfig, eslintReact.configs.recommended, reactHooks.configs.flat.recommended],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  globalIgnores(['**/*.xml', '**/*.html']),
]);
