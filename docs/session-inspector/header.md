---
title: Header
---

The header of the Session Inspector contains various buttons that are key to interacting with the
device itself or the application source.

![Inspector Header](./assets/images/header/app-header.png)

## Device System Buttons

If using the Inspector with an Android or iOS device, the first button group in the header will be
the system buttons, which allow you to simulate the equivalent Android or iOS system functionality:

![Android Buttons](./assets/images/header/system-buttons-android.png) ![iOS Buttons](./assets/images/header/system-buttons-ios.png)

* Android: back / home / app switcher
* iOS: home / Siri
    * The Siri button will open a prompt for input text, which will be used as the Siri command.
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

!!! info

    This button is only visible when using MJPEG screenshotting capabilities like
    `appium:mjpegServerUrl`.

![Pause Source Refresh Button](./assets/images/header/refresh-source-pause.png) ![Resume Source Refresh Button](./assets/images/header/refresh-source-resume.png)

This button allows to disable or re-enable automatic refreshing of the application XML source, once
any changes are detected. This may be useful while interacting with the device through the screenshot,
and the application source is not as relevant. In cases where the XML source is complex and takes
some time to retrieve, disabling its retrieval allows for more seamless device interaction.

## Refresh Source & Screenshot

![Refresh Button](./assets/images/header/refresh-button.png)

If the application screenshot and/or source have changed from the data last captured by the
Inspector, this button allows to trigger a manual refresh and retrieve the latest data.

## Search for Element

![Search Button](./assets/images/header/search-button.png)

This button allows you to search for elements within the current application XML source. Opening it
will show a modal that allows entering the element search details:

![Element Search Modal](./assets/images/header/search-inputs.png)

It is possible to select the locator strategy to be used during element search. Different drivers
support different locator strategies, and the Inspector will try to hide strategies that are not
supported by the current driver.

After selecting the locator strategy, entering the locator string, and pressing Search, the results
screen is shown.

It is possible that no elements are found:

![Empty Element Search Results](./assets/images/header/search-results-empty.png)

If one or more elements are found, the Inspector will list the element count, time taken, and a
list of selectable element IDs:

![Element Search Results](./assets/images/header/search-results.png)

Selecting any element enables the element action buttons:

| Icon | Description |
| ---- | ------ |
| ![Reveal Element in Source](./assets/images/header/search-reveal-element.png) | Attempt to select the element in the application source. Note that this may not work if the element ID has changed. |
| ![Tap Element](./assets/images/header/search-tap-element.png) | Tap the element |
| ![Send or Clear Element Text](./assets/images/header/search-send-clear-element-text.png) | Enter text to send to the element, or clear its text |

## Toggle Recorder

![Start Recording Button](./assets/images/header/record-start-button.png) ![Stop Recording Button](./assets/images/header/record-stop-button.png)

This button allows to enable or disable recording of various user interactions with the application,
and translate them into code that can be used with various Appium clients.

Interactions that can be recorded include:

* Actions for a specific element (tap/send keys/clear)
* Generic tap/swipe actions on the application screenshot
* [System actions](#device-system-buttons)
* [Driver commands](./commands.md)

!!! note

    Recording of custom gestures is not currently supported.

While recording is enabled, the [Recorder tab](./recorder.md) is automatically populated with Appium
client code for all supported interactions.

## Quit Session

![Quit Button](./assets/images/header/quit-button.png)

As the name implies, this button quits the Inspector session and returns to the
[Session Builder](../session-builder/index.md).
