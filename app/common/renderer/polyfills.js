/**
 * The '#local-polyfills' alias is defined in both Vite config files.
 * Since both files define different resolution paths,
 * they cannot be added to tsconfig and eslint configurations
 */

import {
  settings,
  clipboard,
  shell,
  ipcRenderer,
  i18NextBackend,
  i18NextBackendOptions,
  fs,
  util,
} from '#local-polyfills'; // eslint-disable-line import/no-unresolved

export {settings, clipboard, shell, ipcRenderer, i18NextBackend, i18NextBackendOptions, fs, util};
