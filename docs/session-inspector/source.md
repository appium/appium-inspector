---
title: Source Tab
---

The Source tab is the default tab opened after starting an Inspector session. It can be divided into
two connected parts: the Application Source panel, and the Selected Element panel.

![Source Tab](./assets/images/source/source-tab.png)

The divider line in the middle of the tab can be used to adjust the widths of both halves of this
tab, as well as collapse/expand them.

## Application Source

The Application Source is the central panel of the Source Tab, and shows the application source XML
in a tree-like structure.

![Application Source](./assets/images/source/app-source.png)

The panel can be divided into 3 parts: header buttons, source actions, and the source tree.

### Source Header Buttons

| Icon                                                               | Description                               |
| ------------------------------------------------------------------ | ----------------------------------------- |
| ![Copy XML Button](./assets/images/source/copy-button.png)         | Copy the application XML to the clipboard |
| ![Download XML Button](./assets/images/source/download-button.png) | Download the source as an `.xml` file     |

### Source Action Buttons

| Icon                                                                             | Description                                   |
| -------------------------------------------------------------------------------- | --------------------------------------------- |
| ![Collapse All Button](./assets/images/source/collapse-all-button.png)           | Collapse all nodes in the source tree         |
| ![Toggle Attributes Button](./assets/images/source/toggle-attributes-button.png) | Toggle all non-'important' element attributes |
| ![Search Source Field](./assets/images/source/search-source.png)                 | Perform a plaintext search in the source XML  |

### Source Tree

The application source tree is generated from the XML data returned by the Appium driver. By default,
the tree only shows the class name for each element entry, along with several 'important' attributes
such as `value` and `content-desc`. All non-'important' attributes are hidden by default for ease of
navigation, but can be revealed with the [Toggle Attributes button](#source-action-buttons).

All elements in the XML tree are interactable, and clicking on one causes 3 actions:

- The element entry in the XML tree is highlighted
- The element highlighter appears in the [Screenshot panel](./screenshot.md) (if
  [Element Mode](./screenshot.md#interaction-mode) is selected)
- The element details are shown in the [Selected Element panel](#selected-element)

Elements that have one or more child elements have an arrow on their left side, which can be clicked
to toggle visibility of such child elements.

For supported Appium drivers, the maximum depth of the returned XML tree can be adjusted with the
`snapshotMaxDepth` setting.

### Refreshing the Source

By default, the source XML is only updated when a refresh is requested. This can happen when:

- interacting with an element (tap/send keys/clear)
- interacting with the [screenshot](./screenshot.md) (tap/swipe)
- [simulating system actions](./header.md#device-system-buttons)
- [executing driver commands](./commands.md) (depends on the command)
- [executing custom gestures](./gestures.md)
- [pressing the Refresh button](./header.md#refresh-source-screenshot)

Note that interacting with the application outside of the Inspector will _not_ cause the source XML
to refresh.

The use of MJPEG session capabilities (such as `appium:mjpegServerPort`) allows to modify this
behavior. While the default source refresh behavior in MJPEG mode stays the same, the mode adds the
[automatic source refresh button](./header.md#toggle-automatic-source-refresh) in the application
header, which allows to disable automatic refreshing.

## Selected Element

The Selected Element panel is shown on the right side of the Source tab. It is empty by default, but
becomes populated once an element is selected.

![Selected Element](./assets/images/source/selected-element.png)

In order to populate the panel, an element can be selected in one of the following ways:

- Selecting an entry in the [Application Source](#application-source)
- Selecting a highlighter in the [Screenshot panel](./screenshot.md)
- Clicking the [Reveal Element in Source button in the Search Results](./header.md#search-for-element)

The panel can be divided into 4 parts: header buttons, element action buttons, suggested locators,
and element attributes.

### Element Header Buttons

| Icon                                                                       | Description                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| ![Copy Attributes Button](./assets/images/source/copy-button.png)          | Copy the element attributes to the clipboard as an array of JSON objects |
| ![Download Element Screenshot](./assets/images/source/download-button.png) | Download a screenshot of the element as a `.PNG` file                    |

### Element Action Buttons

| Icon                                                                                     | Description                                                                       |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ![Tap Element](./assets/images/header/search-tap-element.png)                            | Tap the element                                                                   |
| ![Send or Clear Element Text](./assets/images/header/search-send-clear-element-text.png) | Enter text to send to the element, or clear its text                              |
| ![Get Element Timings](./assets/images/source/get-timings.png)                           | Run a timing comparison for the [suggested element locators](#suggested-locators) |

### Suggested Locators

This table lists one or more locator strategies + selectors that can be used to find the element.
Clicking on a selector copies it to the clipboard.

Pressing the [timing comparison](#element-action-buttons) button executes a search for each of the
listed strategies + locators, and adds a new table column with the elapsed time until the element
was returned.

![Locators Table With Timings](./assets/images/source/timing-values.png)

### Element Attributes

This table lists all attributes retrieved from the element, along with their values. Clicking on a
value copies it to the clipboard.

Refer to your [Appium driver](https://appium.io/docs/en/latest/ecosystem/drivers/) documentation for
ways to customize the attributes shown in this table.
