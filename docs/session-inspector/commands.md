---
title: Commands Tab
---

The Commands tab provides a way to execute various Appium driver commands through the Inspector GUI.

![Commands Tab](./assets/images/commands/commands-tab.png)

Most commands are grouped into various categories. Opening any category shows several buttons, each
of which corresponds to an Appium driver command.

![Opened Commands Category](./assets/images/commands/opened-category.png)

!!! note

    Commands may be driver-specific, in which case their buttons may not be visible when using
    other drivers.

## Parameters and Conditions

A command may support additional parameters, which affects the behavior of its button:

- For a command without parameters, clicking its button will execute the command
- For a command with parameters, clicking its button will open the parameters popup:

    ![Command Parameters](./assets/images/commands/command-params.png)

A command may also have special conditions (e.g. its functionality is only supported in simulators).
This additional information, if present, is shown as follows:

- For a command without parameters - in a tooltip visible by hovering over the button
- For a command with parameters - inside the parameters popup

## Command Result

Upon execution, certain commands may trigger a refresh for the application screenshot and source.
However, any command will always trigger a new popup upon finishing execution, which shows the
command result.

![Command Result](./assets/images/commands/command-result.png)

The popup also has several buttons for interacting with the result.

### Toggle Table Formatting

![Toggle Table Formatting Button](./assets/images/commands/table-formatting-button.png)

Formats the result as a table, which provides sorting and filtering capabilities. Filters are not
shown for array or object values. Clicking on the contents of any table cell allows copying them to
the clipboard.

This button is enabled only if the command result is an array or object. While the button is toggled
on, the copy result button is disabled.

### Copy Result

![Copy Result Button](./assets/images/commands/copy-button.png)

Copies the result to the clipboard. Disabled while table formatting is active.
