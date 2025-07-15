---
hide:
    - navigation

title: Contributing
---

Want to contribute to this app? We'd love it!

## Code

The code for this app is based on React and Electron.

To start off, clone the project from GitHub and run:

```bash
npm ci
```

!!! note

    There are some possible requirements prior to the install due to
    [`node-gyp`](https://github.com/nodejs/node-gyp#installation):

      - [Python](https://www.python.org/)
      - some C/C++ compiler tools matching your operating system

Run in development mode:

```bash
npm run dev:browser
npm run dev:electron
```

!!! tip

    Development mode runs in a separate dev server, so all Inspector sessions are subject to
    [cross-origin resource sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) (CORS)
    issues. In order to avoid this, before requesting a new session in dev mode, ensure your Appium
    server has been launched with the `--allow-cors` flag.

Run tests:

```bash
npm run test:lint
npm run test:format
npm run test:unit
npm run test:integration
npm run test:e2e

npm run test # lint, unit & integration
```

Build the production version (desktop app into `/dist`, browser app into `/dist-browser`):

```bash
npm run build:browser
npm run build:electron
```

Build the production version and run it:

```bash
npm run preview:browser
npm run preview:electron
```

Build the Electron app executable package (and other artifacts) for your platform into `/release`:

!!! note

    For macOS, this requires code signing environment variables to be set.

```bash
npm run pack:electron
```

## Documentation

The documentation for this app is built using Appium's own [`docutils`](https://github.com/appium/appium/tree/master/packages/docutils),
which is based on [MkDocs](https://www.mkdocs.org/).

To start off, clone the project from GitHub and install it as described in the [Code](#code)
section. Then you can build the documentation:

```bash
npm run install-docs-deps # install the dependencies (Python packages)
npm run dev:docs          # serve the docs locally and watch for changes
```

## Localization

The Inspector code tries to use only localized strings (`t('localizationKey')`), which are
synchronized with [Crowdin](https://crowdin.com/project/appium-desktop). If you would like to
contribute translations, please leave your suggestions on Crowdin.

If you find yourself needing to add completely new strings, first you need to make code changes that
add the strings in the [English translation file](https://github.com/appium/appium-inspector/blob/main/app/common/public/locales/en/translation.json).
After your changes are merged, the new strings will be automatically added to Crowdin, and become
available for translation into other languages.
