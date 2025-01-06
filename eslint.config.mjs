import path from 'node:path';
import {fileURLToPath} from 'node:url';

import appiumConfig from '@appium/eslint-config-appium-ts';
import {includeIgnoreFile} from '@eslint/compat';
import reactPlugin from 'eslint-plugin-react';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

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
    ignores: [...includeIgnoreFile(gitignorePath).ignores, '**/*.xml', '**/*.html'],
  },
];
