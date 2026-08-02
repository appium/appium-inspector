import appiumConfig, {defineConfig, ignorePatterns} from '@appium/oxc-config/oxlint';

export default defineConfig({
  extends: [appiumConfig],
  ignorePatterns: [...ignorePatterns],
  overrides: [
    {
      files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
      plugins: ['react'],
      env: {
        browser: true,
        vitest: true,
      },
      rules: {
        "react/rules-of-hooks": "error",
        "react/exhaustive-deps": "warn"
      }
    }
  ]
});
