---
hide:
    - navigation

title: Troubleshooting
---

This page aims to act as a reference for issues that may be encountered when using the Inspector.

## Cannot open the app after installation

Please refer to the [Installation guide](./quickstart/installation.md).

## Cannot start a session using browser Inspector

The reason for this issue is [cross-origin resource sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
(CORS). Web browsers have security features which prevent CORS. The browser version of the Inspector
needs to make requests to the Appium server directly from the browser via JavaScript, but these
requests are typically not made to the same host (for example, the Inspector is accessed at
`appiumpro.com`, whereas your local Appium server is `localhost:4723`).

In this scenario, you will be unable to start a session, because the browser will prevent it. You
can resolve this issue by starting your Appium server with the `--allow-cors` flag:

```
appium --allow-cors
```

This will instruct the server to sent the correct CORS-related headers, and it should be possible to
create a session.

!!! note

    If you encounter this issue with a cloud provider, the fix must be applied on the provider side,
    because they are the ones hosting the Appium server.

## Browser version does not work in Safari

This is [a known issue](https://github.com/appium/appium-inspector/issues/103). Currently it is
advised to use Chrome, Edge or Firefox instead.

## Start Session button is cut off

This problem may appear if your computer screen size is too small. Check the
[System Requirements](./quickstart/requirements.md) for more details.

## Cannot see full source tree with XCUITest driver + React Native app

This is [a known issue](https://github.com/appium/appium/issues/14825). The problem is caused by
Apple's XCTest framework, so unfortunately it cannot be resolved from the Appium side. However,
there are a few suggestions that may help mitigate this:

-   Set [the `snapshotMaxDepth` setting](https://appium.github.io/appium-xcuitest-driver/latest/settings/)
    to `62` (the maximum stable value)
-   Configure [the `pageSourceExcludedAttributes` setting](https://appium.github.io/appium-xcuitest-driver/latest/settings/)
    to exclude some attributes that you may find less relevant (e.g. `"visible,accessible"`)
-   Set [the `customSnapshotTimeout` setting](https://appium.github.io/appium-xcuitest-driver/latest/settings/)
    to a higher value

If these do not help, then the only remaining solution is to work with the app developers to
refactor the application code. Some suggestions from the linked issue thread include:

-   Try to remove unnecessary nesting levels
-   Use the Fabric renderer with [View Flattening](https://reactnative.dev/architecture/view-flattening)
-   Use native stack navigator instead of stack navigator
-   Reduce the amount of view tags/test IDs
