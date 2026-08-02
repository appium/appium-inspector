import {join} from 'node:path';

import babel from '@rolldown/plugin-babel';
import react, {reactCompilerPreset} from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({command}) => {
  const commonConfig = {
    build: {
      outDir: join(import.meta.dirname, 'dist-browser'),
      emptyOutDir: true,
      minify: false,
      reportCompressedSize: false,
      target: 'es2022',
    },
    define: {
      // add empty polyfills for some Node.js primitives
      'process.argv': [],
      'process.env': {},
    },
    plugins: [
      react(),
      babel({
        presets: [reactCompilerPreset()],
      }),
    ],
    resolve: {
      alias: {
        '#local-polyfills': join(import.meta.dirname, 'app', 'web', 'polyfills'),
      },
    },
    root: join(import.meta.dirname, 'app', 'common'),
    test: {
      mockReset: true,
      root: join(import.meta.dirname, 'test'),
    },
  };
  // workaround to prevent webdriver from bundling various Node.js imports
  if (command === 'build') {
    commonConfig.define = {...commonConfig.define, 'globalThis.window': true};
  }
  return commonConfig;
});
