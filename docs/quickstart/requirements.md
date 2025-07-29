---
hide:
    - toc

title: System Requirements
---

Since the Inspector is released in [3 versions](../overview.md#formats), the requirements for these
will differ:

- Desktop app
    - Works on Windows 10+, macOS 11+, Ubuntu 18.04+, Debian 10+, openSUSE 15.5+, or Fedora Linux 39+
        - [These requirements are taken from Chrome](https://support.google.com/chrome/a/answer/7100626),
          as the Inspector is built using Electron (which uses Chromium)
    - Up to around **600MB** of free space is required
    - The minimum application window size is **890 x 710** pixels
- Web app/Appium server plugin
    - Works in Chrome/Edge/Firefox/Safari, released in 2022 or later
    - The plugin version requires around **9MB** of free space
    - Viewport size of at least **870 x 610** pixels is recommended

### Appium Server Requirements

The Inspector cannot do much without an **Appium server** to connect to. Unless you only want to
connect to existing Appium servers, you will need to install and set up a server of your own,
which can be hosted either locally or remotely. For instructions on how to do this, please refer
to the [Appium documentation](https://appium.io/docs/en/latest/quickstart/install/).

If setting up your own server, make sure to also install the **Appium driver(s)** for your target
platform(s). You can find links to all known drivers in the [Appium documentation's Ecosystem page](https://appium.io/docs/en/latest/ecosystem/drivers/).
Refer to each driver's documentation for its specific requirements and setup instructions.

The following driver versions are recommended for best compatibility:

- [Espresso](https://github.com/appium/appium-espresso-driver): `2.23.0` or later
- [UiAutomator2](https://github.com/appium/appium-uiautomator2-driver): `2.21.0` or later
- [XCUITest](https://appium.github.io/appium-xcuitest-driver/latest/): `3.38.0` or later

Continue with the [Installation](./installation.md) steps, or jump directly to
[Starting a Session](./starting-a-session.md)!
