---
title: Header
---

The header of the Session Inspector contains various buttons that are key to interacting with the
device itself, or the [application source](./source.md).

![Inspector Header](./assets/images/header/app-header.png)

## Device System Buttons

If using the Inspector with an Android or iOS device, the first button group in the header will be
the system buttons, which simulate the equivalent Android or iOS system functionality:

![Android Buttons](./assets/images/header/system-buttons-android.png) ![iOS Buttons](./assets/images/header/system-buttons-ios.png)

- Android: back / home / app switcher
- iOS: home / Siri
    - The Siri button will open a prompt for input text, which will be used as the Siri command.
      Please note that the command will not work if Siri is disabled.

## Context Switcher

![Context Button Group](./assets/images/header/context-group.png)

The context switcher button group allows to change to a
[different application context](https://appium.io/docs/en/latest/guides/context/). By default, the
Inspector works in _native mode_, and makes no attempts to discover other contexts. Pressing the
globe icon will switch to _hybrid mode_, and the Inspector will start the context discovery process.

If no additional contexts are found, the button group will show a new yellow warning icon, which
in turn will show this explanation upon mouseover.

![No Additional Contexts Detected](./assets/images/header/no-additional-contexts.png)

However, if the Inspector _does_ discover more contexts, a new dropdown will appear. There will
also be a new blue icon, which will show further information upon mouseover.

![Multiple Contexts Detected](./assets/images/header/multiple-contexts.png)

The current context can now be switched by selecting the new context in the dropdown.

!!! note

    The Inspector does not automatically switch the current context if a new one is discovered. This
    must be explicitly done using the dropdown.

## Toggle Automatic Source Refresh

![Pause Source Refresh Button](./assets/images/header/refresh-source-pause.png) ![Resume Source Refresh Button](./assets/images/header/refresh-source-resume.png)

!!! info

    This button is only visible when using MJPEG screenshotting capabilities like
    `appium:mjpegServerUrl`.

This button allows to disable or re-enable refreshing the application XML source, when executing
actions that normally trigger a refresh (these are listed in the [Source tab page](./source.md#refreshing-the-source)).
While automatic refresh is disabled, the only way to refresh the source is by using the [Refresh button](#refresh-source-screenshot).

Disabling automatic refresh can be useful while interacting with the device through the [screenshot](./screenshot.md),
in situations when the application source is not important. If the XML source is complex and takes
some time to retrieve, disabling its retrieval allows for more seamless device interaction.

## Refresh Source & Screenshot

![Refresh Button](./assets/images/header/refresh-button.png)

This button triggers a manual refresh of the application screenshot and source, thereby retrieving
the latest data.

## Search for Element

![Search Button](./assets/images/header/search-button.png)

This button opens a new modal window, which can be used to search for elements within the current
application XML source. Searching requires providing the element details:

![Element Search Window](./assets/images/header/search-inputs.png)

There is a choice of multiple locator strategies that can be used during search. Different drivers
support different locator strategies, and the Inspector will try to hide strategies that are not
supported by the current driver.

After selecting the locator strategy, entering the selector string, and pressing _Search_, the
results screen is shown.

If one or more elements are found, the Inspector will list the element count, time taken, and a
list of selectable element IDs:

![Element Search Results](./assets/images/header/search-results.png)

Selecting any element enables the element action buttons:

| Icon                                                                                     | Description                                                                                                         |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| ![Reveal Element in Source](./assets/images/header/search-reveal-element.png)            | Attempt to select the element in the application source. Note that this may not work if the element ID has changed. |
| ![Tap Element](./assets/images/header/search-tap-element.png)                            | Tap the element                                                                                                     |
| ![Send or Clear Element Text](./assets/images/header/search-send-clear-element-text.png) | Enter text to send to the element, or clear its text                                                                |

## Toggle Recorder

![Start Recording Button](./assets/images/header/record-start-button.png) ![Stop Recording Button](./assets/images/header/record-stop-button.png)

This button allows to enable or disable recording of various user interactions with the application,
and translate them into code that can be used with various [Appium clients](https://appium.io/docs/en/latest/ecosystem/clients/).

Interactions that can be recorded include:

- Actions for a specific element (tap/send keys/clear)
- Generic tap/swipe actions on the application screenshot
- [Mobile device system actions](#device-system-buttons)
- [Driver commands](./commands.md)

!!! note

    Recording of custom gestures is not currently supported.

While recording is enabled, the [Recorder tab](./recorder.md) contents are automatically populated
with Appium client code for all supported interactions.

## Quit Session

![Quit Button](./assets/images/header/quit-button.png)

This button quits the Inspector session and returns to the [Session Builder](../session-builder/index.md).
