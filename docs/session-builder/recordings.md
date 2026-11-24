---
hide:
    - toc

title: Recordings Tab
---

The Recordings tab of the Session Builder lists the sessions recorded by the
[Server Recorder](../server-recorder.md) on the
[specified Appium server](./server-details.md), along with their generated
code. It is available when the server runs the
[Inspector plugin](../getting-started.md#appium-plugin).

!!! note

    The tab does not require attaching to a session, so it can be used to
    follow a session driven by another client, such as an AI agent, while it
    is being recorded.

The list is refreshed automatically. Each entry shows the status, the start
time, the application under test and the number of steps. The status is one
of:

- **Not recording**: a live session that is not being recorded
- **Recording**: commands of the session are being recorded
- **Paused**: the recording is paused
- **Finished**: the recording was stopped and saved

Each entry also has buttons to manage it:

- **Record** starts recording a live session
- **Pause** / **Resume** and **Stop** control a running recording
- The delete button removes a finished recording and its saved files, after a
  confirmation

Selecting an entry shows its details:

- **Generated Code**: the recording as test code, in the language selected in
  the dropdown. As in the [Recorder tab](../session-inspector/recorder.md),
  boilerplate code can be shown or hidden, and the code can be copied.
- **Steps**: one row per recorded step, with its action, locator and value.
  Locators that the recorder replaced with a suggested one are marked with ★.
- **locators.md**: the compact step summary, which can also be downloaded.

!!! warning

    Stopping a recording is final: a finished recording cannot be continued.
    Use **Pause** to leave steps out of a recording instead.
