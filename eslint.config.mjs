import appiumConfig from '@appium/eslint-config-appium-ts';
import {defineConfig, globalIgnores} from 'eslint/config';
import reactPlugin from 'eslint-plugin-react';
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
    },
    plugins: {
      'simple-import-sort': simpleImportSortPlugin,
    },
    extends: [
      appiumConfig,
      reactPlugin.configs.flat.recommended,
      reactPlugin.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      'react/prop-types': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  globalIgnores(['**/*.xml', '**/*.html']),
]);
