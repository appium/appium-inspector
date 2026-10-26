---
title: Saved Capability Sets Tab
---

The Saved Capability Sets tab of the Session Builder is used for listing and configuring any saved
capability sets, which can be created using [the button in the footer of the Capability Builder tab](./capability-builder.md#footer).
Parts of this tab are similar to the Capability Builder tab.

![Saved Capability Sets](assets/images/saved-capability-sets/saved-caps-sets.png)

The divider line in the middle of the tab can be used to adjust the widths of both halves of this
tab, as well as collapse/expand the right half.

## List of Saved Capability Sets

The left side of this screen contains a list of all saved capability sets. The number of saved sets
is also shown in the title of the Saved Capability Sets tab.

![Saved Caps Set List](assets/images/saved-capability-sets/saved-caps-set-list.png)

Selecting any set populates the JSON structure on the right side with the contents of the set.
The Actions column of each set also has 3 buttons:

- Open the set in the Capability Builder tab
- Export the set (along with the current session details) as an `.appiumsession` file
- Delete the set

There is also a button at the bottom of the saved capability sets list, which can be used to import
previously exported `.appiumsession` files and automatically add them to the list of saved
capability sets. Multiple files can be imported at the same time.

!!! tip

    If you have installed the standalone desktop app version, you can also open an `.appiumsession`
    file using your file manager/command line. This will launch the Inspector and load the session
    file details in the [Capability Builder tab](./capability-builder.md), which may be useful if
    you do not want to add it as a saved capability set.

## Capability Templates

The _Use a Template_ button below the list provides starting capabilities for Android with
UiAutomator2, Android Chrome, iOS with XCUITest, and iOS Safari. Choose a template to preview its
capabilities and read the device-specific setup notes, then confirm with _Use Template_.

Loading a template replaces the current capabilities and opens the Capability Builder. It does not
change the server configuration or overwrite any saved capability set. Use _Save As_ to save your
customized copy; the built-in templates remain available and unchanged.

These templates provide the platform and driver, plus the browser name for browser sessions. Install
the matching Appium driver and add capabilities for your environment before starting a session:

- Android needs a connected device or a running emulator. Use `appium:udid` to select a specific device.
  For native apps, add `appium:app` to install an app or `appium:appPackage` for an installed app.
  Chrome sessions need Chrome installed on the device.
- For an iOS simulator, specify `appium:deviceName` and `appium:platformVersion`. For a real iOS
  device, specify `appium:udid` and configure code signing. For native apps, add `appium:app` or
  `appium:bundleId`.

Without an app capability, native sessions start on the device's home screen. An `appium:app` path
refers to the Appium server's machine. Do not combine app capabilities with a browser template.
The template dialog links to the driver's documentation for further configuration.

## Saved Capability Set JSON Structure

The JSON structure on the right side shows the capabilities of the saved set in JSON format, exactly
like [in the Capability Builder tab](./capability-builder.md#capability-json-structure). One
additional functionality here is the ability to rename a saved set:

![Saved Caps Name Editor](assets/images/saved-capability-sets/saved-caps-name-editor.png)

## Footer

The footer is largely similar to [that in the Capability Builder tab](./capability-builder.md#footer),
with one additional button:

- The _Save_ button is shown upon selecting any saved capability set, and is enabled after making
  any changes in its capabilities. Pressing it overwrites the capabilities in the saved set with the
  new changes.
