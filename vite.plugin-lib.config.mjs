import {builtinModules} from 'node:module';
import {join} from 'node:path';

import {defineConfig} from 'vite';

const STUB = join(import.meta.dirname, 'plugins', 'lib-src', 'stub.mjs');

// Bundles the Inspector code that the plugin's session recorder needs on the server
// (plugins/lib-src/inspector-lib.mjs) into a single Node module inside the plugin package.
export default defineConfig({
  resolve: {
    alias: [
      // imported by the shared renderer code, but not used by the recorder on the server
      {find: /^refractor\/.*$/, replacement: STUB},
      {find: /^webdriverio$/, replacement: STUB},
    ],
  },
  build: {
    outDir: join(import.meta.dirname, 'plugins', 'lib'),
    emptyOutDir: true,
    minify: false,
    reportCompressedSize: false,
    target: 'node22',
    ssr: join(import.meta.dirname, 'plugins', 'lib-src', 'inspector-lib.mjs'),
    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
      output: {format: 'es', entryFileNames: 'inspector-lib.mjs'},
    },
  },
  ssr: {
    // bundle every dependency: the published plugin only installs @appium/base-plugin
    noExternal: true,
  },
});
