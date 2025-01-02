# Appium Inspector Plugin

A plugin that integrates the [Appium Inspector](https://github.com/appium/appium-inspector) directly into your Appium server installation, providing a web-based interface for inspecting and interacting with your application under test.

## Features

- Web-based Appium Inspector interface accessible via `/inspector` endpoint with appium server
- Full feature parity with standalone Appium Inspector

## Installation

Install the plugin using one of the following methods:

```bash
# Install from local directory. Then, please run 'npm run build:plugin' as well.
appium plugin install --source=local /path/to/appium-inspector/plugins

# Install from npm
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
2. `appium plugin install --source=local /path/to/appium-inspector/plugins`
3. Update the plugin content with `npm run build:plugin` in `/path/to/appium-inspector`
4. Start Appium with `appium --use-plugins=inspector --allow-cors`

This plugin only needs the `appium` server as a `peerDependencies`.

## Release

(TODO: add this release steps in .github/workflows/package.yml later as another PR)

1. Run `npm run plugin:sync:version` to sync the version with the root project.json
2. Run `npm publish` in `/path/to/appium-inspector/plugins` to publish the module

## License

[Apache-2.0](https://github.com/appium/appium-inspector/blob/main/LICENSE)
