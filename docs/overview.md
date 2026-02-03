---
hide:
    - navigation

title: Overview
---

The main purpose of the Inspector is to provide inspection capabilities for the application page
source. It is primarily intended to be used in test automation development, but it can also be
useful in app development - or if one simply wants to take a look at an application's page source!

Under the hood, the Inspector is essentially just an Appium client (based on [WebdriverIO](https://webdriver.io/)),
with a graphical user interface and additional features.

## Formats

The Inspector is distributed in two formats:

- Standalone desktop application for Windows, macOS, and Linux, available for download from
  [its GitHub repo](https://github.com/appium/appium-inspector/releases)
- Appium server plugin, available for installation using
  [Appium's Extension CLI](https://appium.io/docs/en/latest/cli/extensions/)

!!! note

    The Inspector was also formerly released as a web application hosted at <https://inspector.appiumpro.com>. The Appium team no longer has developer access to this site, so even though it remains operational, it is highly unlikely to be updated to a newer Inspector version, and may be taken down without notice. We recommend migrating to the standalone app or the plugin version.

    The Appium team is exploring the idea of hosting an up-to-date version of the web app in the future.

## GUI Overview

There are two main parts to the Inspector user interface:

<div class="grid cards" markdown>

- **[The Session Builder](./session-builder/index.md)**
  ![Session Builder](./assets/images/session-builder.png)
  The default screen, where all the server and session details must be specified.

- **[The Session Inspector](./session-inspector/index.md)**
  ![Session Inspector](./assets/images/session-inspector.png)
  The active session screen, showing the app screenshot, page source, and more.

</div>

## Features Overview

In addition to page source and screenshot inspection, the Inspector provides many other useful
features. Here is a non-exhaustive list of such features:

- Easily define Appium server connection details and capabilities
- Save server details and capability sets for future sessions
- Connect to 10+ different cloud platforms
- Attach to an existing Appium session
- Interact with the application through its screenshot (click/tap, swipe)
- Create and save custom gestures
- Select elements directly through the application screenshot
- Search for elements using supported locator strategies and your own selectors
- Interact with elements (click/tap, send keys, clear)
- View suggested element locator strategies and selectors to be used in your scripts
- Compare the speed of different element finding strategies
- Record your actions directly into Appium client code for 5+ different programming languages
- Simulate system actions for iOS (home, Siri) and Android (back, home, app switch)
- Switch to different application contexts
- Access a library of various Appium driver commands

All features are described in detail in the [Session Builder](./session-builder/index.md) and
[Session Inspector](./session-inspector/index.md) sections.
