---
title: Offline Snapshots
---

Snapshots keep a screenshot and its source XML in one file for later inspection, without a running
Appium server or device. This is useful when investigating a failed test after its session has ended.

## Save and open a snapshot

1. In a live session, refresh the source and screenshot to capture the state you want to inspect.
2. Select **Save Snapshot** in the header. If using MJPEG, switch to **Use Screenshot API** first.
3. After closing or detaching from the session, select **Open Snapshot** in the Session Builder and
   choose the downloaded JSON file. No server details or capabilities are required.

The **Offline Snapshot** banner displays the capture time. You can select elements in the screenshot
or source tree, view their attributes and bounds, generate and copy locators, search the source tree,
and download the source or screenshot. Generated locators are based on the saved XML; they are not
validated against a live application. Device actions, context switching, live locator searches,
commands, gestures, recording and session polling are unavailable. **Close Snapshot** returns to the
Session Builder.

Saving uses the currently displayed source and screenshot, without issuing another device command.
These are separate WebDriver responses and may differ if the application was changing during capture.
The original capture time is preserved when saving a reopened snapshot.

Snapshots exclude server connection details and full capabilities. Source XML and screenshots can
still contain application data, including text entered into fields. Review them before sharing.

## Create snapshots in a test suite

The version 1 format is a single UTF-8 JSON object. A native test teardown can write this structure
using the session's page source, base64 screenshot and window size:

```json
{
  "format": "appium-inspector-snapshot",
  "version": 1,
  "capturedAt": "2026-10-24T12:00:00.000Z",
  "sourceXML": "<hierarchy><android.widget.Button text=\"Continue\" bounds=\"[0,0][100,40]\"/></hierarchy>",
  "screenshot": "<base64 PNG or JPEG image, without a data URL prefix>",
  "windowSize": {"width": 1080, "height": 1920},
  "currentContext": "NATIVE_APP",
  "appMode": "native",
  "featureCaps": {
    "automationName": "uiautomator2",
    "platformName": "android",
    "platformVersion": 16
  }
}
```

Replace the example source, image and dimensions with real values. `windowSize` is the coordinate
space used by element bounds, which may differ from the image's pixel dimensions on high-density
displays. For webviews and browser sessions, prefer exporting from Inspector: it normalizes HTML to
XML and adds element bounds needed for screenshot highlighting. Raw browser HTML with unclosed void
tags is not valid snapshot XML, and source without bounds cannot produce screenshot highlights.
To create a normalized web snapshot yourself, preserve the non-native `currentContext` (such as
`"WEBVIEW_com.example"`) and use `"web_hybrid"` for `appMode` so web locator strategies are generated.

`featureCaps` is optional. Its supported fields are lowercase `automationName`, `platformName` and
`browserName` strings, and a numeric `platformVersion`. Driver metadata enables driver-specific
locator suggestions. Other fields in the file are ignored.

Imports validate the format version, UTC capture time, XML and image before opening. Files are
limited to 50 MiB, XML to 5 MiB and decoded images to 20 MiB. Image dimensions must be at most 32768
per side and 40 megapixels; source trees are limited to 256 levels and 10000 elements. DTDs and
entity declarations are rejected, except for a plain `<!DOCTYPE html>` declaration. Remote image
URLs and SVG images are not supported. An invalid file leaves the current screen intact.
