import react from '@vitejs/plugin-react';
import {join} from 'path';
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({command}) => {
  const commonConfig = {
    build: {
      outDir: join(__dirname, 'dist-browser'),
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
    plugins: [react()],
    resolve: {
      alias: {
        '#local-polyfills': join(__dirname, 'app', 'web', 'polyfills'),
      },
    },
    root: join(__dirname, 'app', 'common'),
    test: {
      restoreMocks: true,
      root: join(__dirname, 'test'),
    },
  };
  // workaround to prevent webdriver from bundling various Node.js imports
  if (command === 'build') {
    commonConfig.define = {...commonConfig.define, 'globalThis.window': true};
  }
  return commonConfig;
});
