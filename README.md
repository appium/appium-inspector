# Appium Inspector

[![Crowdin](https://badges.crowdin.net/appium-desktop/localized.svg)](https://crowdin.com/project/appium-desktop)

<img src="./docs/assets/images/icon.png" alt="Appium Inspector Icon" width="128"/>

A GUI inspector for mobile apps and more, powered by a (separately installed) Appium server. When you're using it to inspect a mobile app, it looks like this:

![Appium Inspector screenshot](./docs/assets/images/inspector-window.png)

Appium Inspector is basically just an Appium client (like WebdriverIO, Appium's Java client, Appium's Python client, etc...) with a user interface. There's an interface for specifying which Appium server to use, which capabilities to set, and then interacting with elements and other Appium commands once you've started a session.

## Important migration notes

This version of Appium Inspector is designed to work with Appium 2.0 (W3C WebDriver protocol) as a default. So if you are migrating from Appium Desktop (which is designed to work with Appium 1.x as a default), you need to be aware of some changes:

> **Note** The default remote server path has changed from `/wd/hub` to `/` to reflect Appium 2.0's default server path. If you're using Appium Inspector with an Appium 1.x server, you'll likely need to update the path information in the New Session form back to `/wd/hub`.

> **Note** Please use Appium 1.x when your environment can work only with the old protocol, not W3C WebDriver protocol

## Installation

Appium Inspector is released in two formats:

1. As a desktop app for macOS, Windows, and Linux. You can get the most recent published version of this app at the [Releases](https://github.com/appium/appium-inspector/releases) section of this repo. Simply grab the appropriate version for your OS and follow standard installation procedures (but see the note below for macOS).
2. As a [web application](https://inspector.appiumpro.com), hosted by [Appium Pro](https://appiumpro.com). (It's currently a [known issue](https://github.com/appium/appium-inspector/issues/103) that the web version does not work on Safari). Please make sure to read the note below on CORS as well.

Both apps have the exact same set of features, so you might find that simply opening the web version is going to be easier and save you on disk space (and you can keep multiple tabs open!).

### Installing on macOS

#### Method 1 - Simplest

If you're using the desktop app on macOS, when you run it you may be greeted with some error about the app not being able to be opened, or not verified by Apple, or something similar. The easiest way to get around this is as follows:

1. _Control+Click_ the Appium Inspector icon in the Applications Finder folder and choose `Open`.

   ![Appium Inspector Ctrl+Click](./docs/quickstart/assets/images/mac-ctrl-click.png)

2. You'll be presented with the dialog below. Just click `Open` and Appium Inspector should launch.

   ![Appium Inspector Open Warning](./docs/quickstart/assets/images/open-warning.png)

#### Method 2 - Command Line

If this doesn't work, you can try the command line. Run `xattr -cr` on the file you downloaded. So let's say you downloaded `appium-inspector.dmg` and copied `Appium Inspector.app` inside the disk image to the system `/Applications` folder. Then you would run `xattr -cr "/Applications/Appium Inspector.app"` before opening it. The same goes for the zip version (or the .app itself).

### Installing on Linux

To run the `.AppImage` file on Linux, you will need to make sure that it is executable (e.g.,
`chmod a+x Appium-Inspector-linux.AppImage`. Then you can run it from the command line simply as
any other command: `./Appium-Inspector-linux.AppImage`.

## Features

- Easily define Appium server connection details and set up capabilities
- Save server details and capability sets for future sessions
- Connect to a variety of cloud Appium platforms
- Attach to an existing Appium session via its ID
- Inspect the screenshot and source of a mobile app. (This inspector is designed to work with iOS and Android. Other Appium platforms might also work, but they probably won't without some updates to the code here. PRs welcome!)
- Select elements via clicking on them in the screenshot
- Interact with elements (click, send keys, clear)
- Get a list of suggested element locator strategies and selectors to be used in your scripts
- Compare the speed of different element finding strategies
- Start and stop "recording" mode, which translates your actions in the Inspector to code samples you can use in your scripts
- Start and stop "source refreshing", which allows interacting with the device screen without reloading page source (MJPEG stream capabilities are required)
- Tap on the screen at an arbitrary location
- Perform a swipe gesture
- Simulate system buttons for iOS (home) and Android (back/home/app switch)
- Simulate Siri commands for iOS
- Switch into web context modes and interact with web elements
- Test out your own locator strategies
- Access a huge library of Appium commands to run with a simple click, including providing your own parameters

### Supported cloud platforms

| Platform                                    | Docs                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Sauce Labs](https://saucelabs.com)         | [Documentation](https://wiki.saucelabs.com/)                                          |
| [HeadSpin](https://headspin.io)             | [Documentation](https://headspin.io/)                                                 |
| [Browserstack](https://browserstack.com)    | [Documentation](https://www.browserstack.com/docs)                                    |
| [Lambdatest](https://lambdatest.com)        | [Documentation](https://www.lambdatest.com/support/docs/appium-inspector-integration) |
| [Bitbar](https://bitbar.com)                | [Documentation](http://docs.bitbar.com/)                                              |
| [Kobiton](https://kobiton.com)              | [Documentation](https://docs.kobiton.com/)                                            |
| [Perfecto](https://www.perfecto.io)         | [Documentation](https://developers.perfectomobile.com/display/PD/Appium)              |
| [Pcloudy](https://www.pcloudy.com)          | [Documentation](https://www.pcloudy.com/mobile-application-testing-documentation)     |
| [TestingBot](https://testingbot.com)        | [Documentation](https://testingbot.com/support)                                       |
| [Experitest](http://www.experitest.com)     | [Documentation](https://docs.experitest.com/display/TE/Appium)                        |
| [RobotQA](https://www.robotqa.com)          | [Documentation](https://robotqa.com/appium-remote)                                    |
| [Remote TestKit](https://appkitbox.com/en/) | [Documentation](https://appkitbox.com/en/support/automation/appium/)                  |
| [Mobitru](https://mobitru.com/)             | [Documentation](https://mobitru.com/docs/automation/)                                 |

## Requirements

As mentioned above, the Inspector is basically an Appium client, so for it to function correctly you will need:

1. A running Appium server accessible via the network by the Inspector (for example, an Appium server running on localhost, or one running on a cloud service).
2. All of the appropriate Appium drivers, plugins, and other dependencies that those might entail.

Basically, if you can start an Appium session from your typical client library, you should be able to do the same with the Inspector.

### Screen size

The Inspector desktop app has a minimum size of **890 x 710** pixels, whereas the web application works best when using a viewport size of at least **870 x 610** pixels.

### Connecting to a local server from the browser inspector (CORS)

Web browsers have security features which prevent [cross-origin resource sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) in general. The browser version of the Inspector needs to make requests to the Appium server directly from the browser via JavaScript, but these requests are typically not made to the same host (for example, the Inspector is accessed at `appiumpro.com`, whereas your local Appium Server is `localhost:4723`).

In this scenario, you will be unable to start a session, because the browser will prevent it. To work around this limitation, you can start your Appium server with `--allow-cors`, so that the Appium server knows to send the appropriate CORS-related headers.

If you run into this issue with a cloud platform, then the cloud platform needs to update their server frontend to support the CORS scenario as well.

## Reporting issues

If you run into a problem, first ascertain whether it's a problem with the Inspector specifically or if it's a problem with Appium. The way to do that is to reproduce the issue in code, using an Appium client library. If the issue still exists, then it's not an issue with the Inspector, and it should be reported instead at the [main Appium repo](https://github.com/appium/appium/issues).

Issues that have to do with the Inspector specifically can be reported here at this repo.

## Development

Want to help us develop this app? We'd love it! Getting set up to do development is pretty easy:

1. Clone the repo
2. Install dependencies (`npm ci`)

> **Note** There are some possible requirements prior to the install, because of [node-gyp](https://github.com/nodejs/node-gyp#installation):
>
> - [Python](https://www.python.org/)
> - some C/C++ compiler tools matching your operating system

From here, have a look at the `scripts` field of our package.json to see what kind of dev scripts you might want to run. Some of the most useful are:

- `npm test`: run basic lint and unit tests
- `npm run e2e`: run E2E tests
- `npm run dev`: run the app in dev mode (will refresh when you make code changes)
- `npm run build`: build the production version of the app into `dist/`
- `npm run build:browser`: build a version of the app for web browsers into `dist-browser/`
- `npm run start`: start the production version of the app
- `npm run clean`: remove all caches and node modules and reinstall everything
- `npx electron-builder build --publish never`: package the app for your platform (into `release/`). Note that for macOS this requires code signing environment variables to be set.

### Localization

We try to use only localized strings (`t('localizationKey')`), which are synchronized with [Crowdin](https://crowdin.com/project/appium-desktop). If you would like to contribute translations, please leave your suggestions on Crowdin.

If you find yourself needing to add completely new strings, you'll need to first add them in the [English translation file](assets/locales/en/translation.json). After your changes are merged, the new strings will be added to Crowdin, and become available for translation into other languages.

### Publishing new versions

The version scheme we use for this app is `<RELEASE_YEAR>.<RELEASE_MONTH_NUM>.<RELEASE_COUNT_FOR_MONTH>`. So the first release in the month of April in the year 2022 would be `2022.4.1`, and the 10th in that month would be `2022.4.10`.

Publishing happens via CI (see the scripts in `ci-jobs`), whenever the appropriate git version tags are pushed.
