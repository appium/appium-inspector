---
title: Screenshot Panel
---

The Screenshot panel is shown on the left side of the Session Inspector. As the name implies, the
panel contains a screenshot of the current device screen, and also provides several ways of
interacting with the screenshot.

![Screenshot Panel](assets/images/screenshot/app-screenshot.png)

## Screenshot Properties

The panel supports screenshots of various sizes and orientations:

![Screenshot Panel in Landscape](assets/images/screenshot/app-screenshot-landscape.png)

Normally, the screenshot itself is a static image, which is only updated when a refresh is
requested. This can happen when:

* interacting with an element (tap/send keys/clear)
* interacting with the screenshot itself (tap/swipe)
* [simulating system actions](./header.md#device-system-buttons)
* [executing driver commands](./commands.md) (depends on the command)
* [executing custom gestures](./gestures.md)
* [pressing the Refresh button](./header.md#refresh-source-screenshot)

However, if MJPEG capabilities are used, the screenshot will update automatically, always mirroring
the actual device screen.

By default, hovering over the screenshot will highlight any detected elements. Clicking on any
highlighter will then select the corresponding element in the application source, and show its
details in the selected element panel.

## Screenshot Panel Header