---
hide:
  - navigation

title: Contributing
---

Contributions to this project are welcome!

## Code & Documentation

To start off, clone the project from GitHub and run:

```bash
npm install
```

!!! note

    There are some possible requirements prior to the install due to
    [`node-gyp`](https://github.com/nodejs/node-gyp#installation):

      - [Python](https://www.python.org/)
      - some C/C++ compiler tools matching your operating system

Watch changes during development:

```bash
npm run dev           # desktop app
npm run watch:browser # browser app
```

Start the production version of the desktop app:

```bash
npm run start
```

Run tests:

```bash
npm run test:lint
npm run test:format
npm run test:unit
npm run test:integration
npm run e2e

npm run test # lint, unit & integration
```

Build the full app (desktop app into `/dist`, browser app into `/dist-browser`):

```bash
npm run build # desktop and browser
npm run build:browser
```

Build the app executable package (and other artifacts) for your platform into `/release`:

!!! note

    For macOS, this requires code signing environment variables to be set.

```bash
npx electron-builder build --publish never
```

Develop documentation:

```bash
npm run install-docs-deps # install the dependencies (Python packages)
npm run dev:docs          # serve the docs locally and watch for changes
```

## Localization

The Inspector code tries to use only localized strings (`t('localizationKey')`), which are
synchronized with [Crowdin](https://crowdin.com/project/appium-desktop). If you would like to
contribute translations, please leave your suggestions on Crowdin.

If you find yourself needing to add completely new strings, first you need to make code changes that
add the strings in the [English translation file](https://github.com/appium/appium-inspector/blob/main/assets/locales/en/translation.json).
After your changes are merged, the new strings will be automatically added to Crowdin, and become
available for translation into other languages.
