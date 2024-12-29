# Appium Inspector Plugin

This package is https://github.com/appium/appium-inspector as an Appium plugin.

```
appium plugin install --source=local /path/to/appium-inspector/plugins
```

```
appium plugin install --source=npm appium-inspector-plugin
```

will be:

```
appium plugin install inspector
```

in Appium 3.


Then, running Appium with:

```
appium --use-plugins=inspector
```

let `/inspector` endpoint to provide appium inspector.