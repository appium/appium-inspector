---
hide:
    - navigation

title: Menu Bar
---

The **Menu Bar** is the always shown either at the top of the application window (Windows) or in the
system menu bar (macOS).

![macOS Menu Bar](assets/images/menu-bar-macos.png)

!!! note

    The menu bar is not available in the [web app version](./overview.md#formats) of the Inspector.

Several standard menu bar options are included, mainly related to window and text management.
However, there are a few specific options as well:

## Update Checker

The update checker is available under the _File_ menu (Windows/Linux) or the application menu
(macOS). It can be used to check if there is a newer version of the Inspector available, and if so,
it is possible to automatically download and install the latest version.

Updating is supported for the following application formats:

- macOS: `.dmg`
- Windows: `.exe` installer
- Linux: `.AppImage`

## Open/Save Session

The _Open Session File_ / _Save As_ options in the _File_ menu provides the ability to import and
export session details. Only one set of session details can be imported/exported at a time.

### Exporting Sessions

Selecting the _Save As_ option will package the currently specified server and session details into
a downloadable `.appiumsession` file, which can then be shared to other computers.

### Importing Sessions

Selecting the _Open Session File_ option will load the server and session details in the
[Session Builder](./session-builder/index.md). The loaded information can then be modified and/or
saved inside the Inspector.

## Change Language

The _Language_ option in the _View_ menu allows to change the entire application language. Currently
there are over 20 available languages with community-provided translations!

!!! note

    Most languages only include partial translations. You can help by providing your translations on
    [Crowdin](https://crowdin.com/project/appium-desktop)!
