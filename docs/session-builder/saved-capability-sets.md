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

Each entry in the list of saved sets has 3 buttons:

- Open the set in the Capability Builder tab
- Export the set (along with the current session details) as an `.appiumsession` file
- Delete the set

The bottom of the list also provides buttons for importing a capability set from a file, or
applying capabilities from a built-in template.

### Import from File

The import button is used for importing previously exported `.appiumsession` files. Clicking the
button opens a file browser window, and selecting one or more session files loads them into the
Inspector and automatically adds them to the list of saved capability sets.

!!! tip

    If using the standalone desktop app version, you can also open an `.appiumsession` file using
    your file manager/command line. This will launch the Inspector and load the session file
    details in the [Capability Builder tab](./capability-builder.md), which may be useful if you do
    not want to add it as a saved capability set.

### Use Template

The template button provides access to multiple built-in capability set templates, which can be
used as a starting point for creating more complex capability sets. Clicking the button opens a new
modal window, where the dropdown can be used to select the desired template:

![Capability Templates](assets/images/saved-capability-sets/capability-templates.png)

Clicking the _Use Template_ button then replaces the current capability set with the template
contents.

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
