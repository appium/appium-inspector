import {join} from 'node:path';

import react from '@vitejs/plugin-react';
import {defineConfig} from 'electron-vite';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  main: {
    build: {
      outDir: join(__dirname, 'dist', 'main'),
      lib: {
        entry: join(__dirname, 'app', 'electron', 'main', 'main.js'),
      },
    },
    // main process has a few imports from common, so this is needed
    resolve: {
      alias: {
        '#local-polyfills': join(__dirname, 'app', 'electron', 'renderer', 'polyfills'),
      },
    },
  },
  preload: {
    build: {
      outDir: join(__dirname, 'dist', 'preload'),
      lib: {
        entry: join(__dirname, 'app', 'electron', 'preload', 'preload.mjs'),
      },
    },
  },
  renderer: {
    build: {
      outDir: join(__dirname, 'dist', 'renderer'),
      rollupOptions: {
        input: {
          main: join(__dirname, 'app', 'common', 'index.html'),
          splash: join(__dirname, 'app', 'common', 'splash.html'),
        },
      },
    },
    plugins: [
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      renderer(),
    ],
    resolve: {
      alias: {
        '#local-polyfills': join(__dirname, 'app', 'electron', 'renderer', 'polyfills'),
      },
    },
    root: join(__dirname, 'app', 'common'),
  },
});
