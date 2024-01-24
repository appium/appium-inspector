---
title: Header
---

The header of the Session Inspector contains various buttons that are key to interacting with the
device itself or the application source.

![Inspector Header](./assets/images/header/app-header.png)

## Device System Buttons

If using the Inspector with an Android or iOS device, the first button group in the header will be
the system buttons, which allow you to simulate the equivalent Android or iOS system functionality:

![Android Buttons](assets/images/header/system-buttons-android.png) ![iOS Buttons](assets/images/header/system-buttons-ios.png)

* Android: back / home / app switcher
* iOS: home / Siri
    * The Siri button will open a prompt for input text, which will be used as the Siri command.
      Please note that the command will not work if Siri is disabled.

## Context Switcher

![Context Group](assets/images/header/context-group.png)

The context switcher button group allows to change to a
[different application context](https://appium.io/docs/en/latest/guides/context/). By default, the
Inspector works in __native mode__, which does not look for other contexts. Pressing the globe icon
will switch to __hybrid mode__, and the Inspector will attempt to discover additional contexts.

If no additional contexts are found, the button group will show a new yellow warning icon, which
will also show this explanation upon mouseover.

![No Additional Contexts](assets/images/header/no-additional-contexts.png)

However, if the Inspector _does_ discover more contexts, a new dropdown will be shown. There will
also be a new blue icon, which will show further information upon mouseover.

![Multiple Contexts](assets/images/header/multiple-contexts.png)

The current context can now be switched by selecting the new context in the dropdown.

!!! note

    The Inspector does not automatically switch the current context if a new one is discovered. This
    must be explicitly done using the dropdown.

## Toggle Automatic Source Refresh

## Refresh Source & Screenshot

## Search for Element

## Toggle Recorder

## Quit Session

As the name implies, this button quits the Inspector session and returns to the Session Builder.
