import react from '@vitejs/plugin-react';
import {join} from 'path';
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: join(__dirname, 'dist-browser'),
    emptyOutDir: true,
    minify: false, // needed to avoid issues with web2driver
    reportCompressedSize: false,
    target: 'es2022',
  },
  define: {
    'process.env': process.env,
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
        additionalData: '@root-entry-name: default;',
      },
    },
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
});
