import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {includeIgnoreFile} from '@eslint/compat';
import {FlatCompat} from '@eslint/eslintrc';
import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import globals from 'globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    name: 'React Plugin',
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    ...reactPlugin.configs.flat.recommended,
  },
  ...compat.extends('@appium/eslint-config-appium-ts'),
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
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          'varsIgnorePattern': 'React'
        }
      ],
      'react/prop-types': 'off',
    },
  },
  {
    ignores: [
      ...includeIgnoreFile(gitignorePath).ignores,
      '**/.*', // dotfiles aren't ignored by default in FlatConfig
      '**/*.xml',
      '**/*.html',
    ],
  },
];
