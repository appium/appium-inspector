# Appium Inspector Plugin

A plugin that integrates the [Appium Inspector](https://github.com/appium/appium-inspector) directly into your Appium server installation, providing a web-based interface for inspecting and interacting with your application under test.

## Features

- Seamless integration with Appium server
- Web-based interface accessible via `/inspector` endpoint
- Full feature parity with standalone Appium Inspector
- No need for separate Inspector installation

## Installation

### Current Version

Install the plugin using one of the following methods:

```bash
# Install from local directory
appium plugin install --source=local /path/to/appium-inspector/plugins

# Install from npm
appium plugin install --source=npm appium-inspector-plugin
```

### Coming in Appium 3

Installation will be simplified to:

```bash
appium plugin install inspector
```

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
2. `appium plugin install --source=local /path/to/appium-inspector/plugins`
3. Update the plugin content with `npm run build:plugin` in `/path/to/appium-inspector`
4. Start Appium with `appium --use-plugins=inspector --allow-cors`


## License

[Apache-2.0](https://github.com/appium/appium-inspector/blob/main/LICENSE)
