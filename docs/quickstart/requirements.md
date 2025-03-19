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
    - Works in Chrome/Edge/Firefox, released in 2022 or later
      ([Safari is not supported](../troubleshooting.md#browser-version-does-not-work-in-safari))
    - Viewport size of at least **870 x 610** pixels is recommended

All Inspector versions also require an **Appium server** to connect to:

- The server can be run either locally or remotely
- For server installation, refer to the [Appium documentation](https://appium.io/docs/en/latest/quickstart/install/).
  Make sure to also install the necessary [driver(s)](https://appium.io/docs/en/latest/ecosystem/drivers/)
  for your target platform(s).

While the Inspector is designed to work with Appium 2 or newer, it is also compatible with
later versions of Appium 1. If connecting to an Appium 1 server, please be aware of
[the differences from Appium 2](https://appium.io/docs/en/latest/guides/migrating-1-to-2/) -
in particular, the default server base path.
