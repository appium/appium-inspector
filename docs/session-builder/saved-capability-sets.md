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

Selecting any set populates the JSON structure on the right side with the contents of the set. There
are also 2 buttons: one for opening the set in the Capability Builder tab, and one for deleting the set.

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
