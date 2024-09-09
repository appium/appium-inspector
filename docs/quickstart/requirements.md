---
hide:
    - toc

title: System Requirements
---

Since the Inspector has two versions, [a desktop app and a web app](../overview.md#formats), the
requirements for these will differ.

-   Web app
    -   Works in Chrome/Edge/Firefox, released in 2022 or later
        ([Safari is not supported](../troubleshooting.md#browser-version-does-not-work-in-safari))
    -   Viewport size of at least **870 x 610** pixels is recommended
-   Desktop app
    -   Works on Windows 10+, macOS 10.15+, Ubuntu 18.04+, Debian 10+, openSUSE 15.5+, or Fedora Linux 39+
        -   [These requirements are taken from Chrome](https://support.google.com/chrome/a/answer/7100626),
            as the Inspector is built using Electron (which uses Chromium)
    -   Up to around **600MB** of free space is required
    -   The minimum application window size is **890 x 710** pixels

Both Inspector versions also require an **Appium server** to connect to, which is _not_ bundled with
the Inspector. This server can be run either locally or remotely. If you need to install it, please
check the [Appium Install documentation](https://appium.io/docs/en/latest/quickstart/install/)
for details.

!!! note

    If using a standalone Appium server, make sure the server also has the necessary
    [driver(s)](https://appium.io/docs/en/latest/ecosystem/drivers/) for your target platform(s)!

While the Inspector is designed to work with Appium 2, it is also compatible with
later versions of Appium 1. Please be aware of
[the differences between both Appium versions](https://appium.io/docs/en/latest/guides/migrating-1-to-2/) -
in particular, the default server base path.
