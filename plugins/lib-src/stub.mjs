// Replaces browser/client-only dependencies in the plugin's server bundle (vite.plugin-lib.config.mjs):
// syntax highlighting grammars (refractor/*) and the WebDriver client (webdriverio), which the
// recorder's locator generation and code generators import but never use.
export default {};
export const remote = undefined;
