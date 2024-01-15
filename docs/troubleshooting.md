---
hide:
  - navigation

title: Troubleshooting
---

This page aims to act as a reference for issues that may be encountered when using the Inspector.

## Cannot open the app after installation

Please refer to the Installation guide.

## Cannot start a session using browser Inspector

The reason for this issue is [cross-origin resource sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
(CORS). Web browsers have security features which prevent CORS. The browser version of the Inspector
needs to make requests to the Appium server directly from the browser via JavaScript, but these
requests are typically not made to the same host (for example, the Inspector is accessed at
`appiumpro.com`, whereas your local Appium Server is `localhost:4723`).

In this scenario, you will be unable to start a session, because the browser will prevent it. You
can resolve this issue by starting your Appium server with the `--allow-cors` flag:

```
appium --allow-cors
```

This will instruct the server to sent the correct CORS-related headers, and it should be possible to
create a session.

!!! note

    If you encounter this issue with a cloud provider, the fix must be applied on their side,
    because they are the ones hosting the Appium server.

## Auto-updater not working

This is [a known issue](https://github.com/appium/appium-inspector/issues/733) and is planned to be
fixed in future versions.

## Browser version does not work in Safari

This is [a known issue](https://github.com/appium/appium-inspector/issues/103). Currently it is
advised to use Chrome or Firefox instead.

## Start Session button is cut off

This problem may appear if your computer screen size is too small. The Inspector desktop app has a
minimum size of **890 x 710** pixels, whereas the web application works best when using a viewport
size of at least **870 x 610** pixels. Please make sure your screen is sufficiently large.
