---
hide:
    - navigation

title: Troubleshooting
---

This page aims to act as a reference for issues that may be encountered when using the Inspector.

## Cannot open the app after installation

Please refer to the [Installation guide](./quickstart/installation.md).

## Cannot start a session using plugin version

The reason for this issue is [cross-origin resource sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
(CORS). The browser will prevent you from connecting to the Appium server if the base URLs of the
Inspector and the Appium server do not match (the server typically uses `127.0.0.1`).

If the base URLs of the server and the Inspector differ (`localhost` is considered different from
`127.0.0.1`), CORS must be explicitly allowed when starting the server.

Additionally, since Appium 4, the server rejects state-changing requests (such as `POST /session`)
that carry an `Origin` header unless CORS is enabled. Browsers send this header even when the
Inspector and the server share the same base URL, so the CORS feature must be enabled for the
plugin version _regardless of the Inspector's URL_.

=== "Appium 4"

    ```sh
    appium --use-plugins=inspector --allow-insecure='*:cors'
    # alternatively: appium --use-plugins=inspector --relaxed-security
    ```

=== "Appium 2-3"

    ```sh
    appium --use-plugins=inspector --allow-cors
    ```

!!! note

    If you encounter this issue with a cloud provider, any changes must be applied on the provider
    side, because they are the ones hosting the Appium server.

## Cannot see full source tree with XCUITest driver + React Native app

This is [a known issue](https://github.com/appium/appium/issues/14825). The problem is caused by
Apple's XCTest framework, so unfortunately it cannot be resolved from the Appium side. However,
there are a few suggestions that may help mitigate this:

- Set [the `snapshotMaxDepth` setting](https://appium.github.io/appium-xcuitest-driver/latest/settings/#snapshotmaxdepth)
  to `62` (the maximum stable value)
- Configure [the `pageSourceExcludedAttributes` setting](https://appium.github.io/appium-xcuitest-driver/latest/settings/#pagesourceexcludedattributes)
  to exclude some attributes that you may find less relevant (e.g. `"visible,accessible"`)
- Set [the `customSnapshotTimeout` setting](https://appium.github.io/appium-xcuitest-driver/v9/reference/settings/)
  to a higher value (for XCUITest driver version < 8)

If these do not help, then the only remaining solution is to work with the app developers to
refactor the application code. Some suggestions from the linked issue thread include:

- Try to remove unnecessary nesting levels
- Use the Fabric renderer with [View Flattening](https://reactnative.dev/architecture/view-flattening)
- Use native stack navigator instead of stack navigator
- Reduce the amount of view tags/test IDs
