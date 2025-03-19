# Appium Inspector Plugin

[![npm version](http://img.shields.io/npm/v/appium-inspector-plugin.svg)](https://npmjs.org/package/appium-inspector-plugin)
[![Downloads](http://img.shields.io/npm/dm/appium-inspector-plugin.svg)](https://npmjs.org/package/appium-inspector-plugin)

A plugin that integrates the [Appium Inspector](https://github.com/appium/appium-inspector) directly into your Appium server installation, providing a web-based interface for inspecting and interacting with your application under test.

## Features

- Web-based Appium Inspector interface, accessible via the Appium server's `/inspector` endpoint
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

2. Access the Inspector in your web browser by navigating to:

```
http://localhost:4723/inspector
```

Make sure the above **host URL** and **port** match those of the Appium server itself.
Note that the server's base path value is ignored - the plugin always uses the `/inspector` path. 

## Development

### Set Up

1. Clone this repo
2. `cd /path/to/appium-inspector/plugins`
3. `npm install`
4. `appium plugin install --source=local /path/to/appium-inspector/plugins`

### Develop

1. `cd /path/to/appium-inspector`
2. `npm run build:plugin`
3. `appium --use-plugins=inspector --allow-cors`

## License

[Apache-2.0](https://github.com/appium/appium-inspector/blob/main/LICENSE)
