import {join} from 'node:path';

import react from '@vitejs/plugin-react';
import {defineConfig} from 'electron-vite';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  main: {
    build: {
      outDir: join(import.meta.dirname, 'dist', 'main'),
      lib: {
        entry: join(import.meta.dirname, 'app', 'electron', 'main', 'main.js'),
      },
    },
    // main process has a few imports from common, so this is needed
    resolve: {
      alias: {
        '#local-polyfills': join(import.meta.dirname, 'app', 'electron', 'renderer', 'polyfills'),
      },
    },
  },
  preload: {
    build: {
      outDir: join(import.meta.dirname, 'dist', 'preload'),
      lib: {
        entry: join(import.meta.dirname, 'app', 'electron', 'preload', 'preload.mjs'),
      },
    },
  },
  renderer: {
    build: {
      outDir: join(import.meta.dirname, 'dist', 'renderer'),
      rollupOptions: {
        input: {
          main: join(import.meta.dirname, 'app', 'common', 'index.html'),
          splash: join(import.meta.dirname, 'app', 'common', 'splash.html'),
        },
      },
    },
    plugins: [
      react({compiler: true}),
      renderer(),
      {
        name: 'strip-node-scheme-side-effect-imports',
        apply: 'build',
        enforce: 'post',
        /**
         * As of vite-plugin-electron-renderer v1, bundling webdriver (specifically, @wdio/utils)
         * adds `node:` imports to the top of the generated main.js, causing the renderer to fail.
         * These imports aren't needed by the Inspector, so just remove them from the file.
         *
         * Configuring vite-plugin-electron-renderer to import webdriver as CJS in turn causes errors
         * coming from its undici dependency, so that is not a solution.
         */
        generateBundle(_outputOptions, bundle) {
          for (const output of Object.values(bundle)) {
            if (output.type !== 'chunk') {
              continue;
            }
            output.code = output.code.replace(/^import "node:(?:fs\/promises|url|path)";\n/gm, '');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '#local-polyfills': join(import.meta.dirname, 'app', 'electron', 'renderer', 'polyfills'),
      },
    },
    root: join(import.meta.dirname, 'app', 'common'),
  },
});
