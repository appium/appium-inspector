# Appium Inspector Plugin

[![npm version](http://img.shields.io/npm/v/appium-inspector-plugin.svg)](https://npmjs.org/package/appium-inspector-plugin)
[![Downloads](http://img.shields.io/npm/dm/appium-inspector-plugin.svg)](https://npmjs.org/package/appium-inspector-plugin)

A plugin that integrates the [Appium Inspector](https://github.com/appium/appium-inspector) directly into your Appium server installation, providing a web-based interface for inspecting and interacting with your application under test.

## Features

- Web-based Appium Inspector interface accessible via `/inspector` endpoint with appium server
- Full feature parity with standalone Appium Inspector

## Installation

```bash
appium plugin install --source=npm appium-inspector-plugin
```

> [!Note]
> Appium 3 will support this plugin as a first-class plugin with `appium plugin install inspector`

## Usage

1. Start Appium server with the inspector plugin enabled:

```bash
appium --use-plugins=inspector --allow-cors
```

2. Access the Inspector interface by navigating to:

```
http://localhost:4723/inspector
```

## Development

1. `git clone` this repositiry
2. Run `npm install` in `/path/to/appium-inspector/plugins`
3. `appium plugin install --source=local /path/to/appium-inspector/plugins`
4. Update the plugin content with `npm run build:plugin` in `/path/to/appium-inspector`
5. Start Appium with `appium --use-plugins=inspector --allow-cors`

## Release

(TODO: add this release steps in .github/workflows/package.yml later as another PR)

1. Run `npm run plugin:sync:version` to sync the version with the root project.json
2. Run `npm publish` in `/path/to/appium-inspector/plugins` to publish the module

## License

[Apache-2.0](https://github.com/appium/appium-inspector/blob/main/LICENSE)
