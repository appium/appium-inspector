import appiumConfig from '@appium/eslint-config-appium-ts';
import reactPlugin from 'eslint-plugin-react';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default [
  ...appiumConfig,
  {
    name: 'React Plugin',
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat['jsx-runtime'],
  },
  {
    name: 'JS/TS Files',
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
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/prop-types': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
  {
    name: 'Ignores',
    ignores: ['**/*.xml', '**/*.html'],
  },
];
