<p align="center">
   <a href="https://appium.github.io/appium-inspector/">
      <img alt="Appium" src="./docs/assets/images/icon.png" width="200">
   </a>
</p>
<p align="center">
   GUI Inspector tool for all kinds of apps, powered by Appium.
</p>

<div align="center">

![Current Version](https://img.shields.io/github/package-json/v/appium/appium-inspector)
![Current Version GitHub Downloads](https://img.shields.io/github/downloads/appium/appium-inspector/latest/total)
![Total GitHub Downloads](https://img.shields.io/github/downloads/appium/appium-inspector/total)
[![Crowdin](https://badges.crowdin.net/appium-desktop/localized.svg)](https://crowdin.com/project/appium-desktop)

</div>

---

<p align="center"><b>
   <a href="https://appium.github.io/appium-inspector/">Documentation</a> |
   <a href="https://appium.github.io/appium-inspector/latest/quickstart/">Get Started</a> |
   <a href="https://discuss.appium.io">Discussion Forum</a> |
   <a href="https://crowdin.com/project/appium-desktop">Help with Translations</a>
</b></p>

---

Appium Inspector is a GUI assistant tool for Appium, providing visual inspection of the application
under test. It can show the application page screenshot along with its page source, and includes
various features for interacting with the app.

When inspecting a mobile app, the Inspector looks like this:

![Appium Inspector screenshot](./docs/assets/images/inspector-window.png)

## Installation

Appium Inspector is released in two formats:

1. Standalone desktop application for macOS, Windows, and Linux - download it from the
   [**Releases**](https://github.com/appium/appium-inspector/releases) section
2. Web application - **<https://inspector.appiumpro.com>** (note that
   [CORS must be enabled](https://appium.github.io/appium-inspector/latest/troubleshooting/#cannot-start-a-session-using-browser-inspector)
   in order to connect to an Appium server)

Check the [System Requirements](https://appium.github.io/appium-inspector/latest/quickstart/requirements/)
and [Installation](https://appium.github.io/appium-inspector/latest/quickstart/installation/)
documentation for more details.

## Features

The Inspector has many features in addition to its app inspection abilities:

- Specify the Appium server details
- Interact with the app screenshot
- Search for elements and interact with them
- Run Appium driver commands
- and more...

Check the [Features documentation](https://appium.github.io/appium-inspector/latest/overview/#features-overview)
for a more comprehensive list!

### Cloud Platforms

The Inspector has built-in integrations with various cloud service provider platforms:

<table>
  <tr>
    <td align="center" valign="center">
      <a href="https://docs.saucelabs.com/mobile-apps/automated-testing/appium/">
        <img width="200" height="50" alt="SauceLabs" src="app/common/renderer/assets/images/sauce_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://www.headspin.io/docs/appium-inspector-integration">
        <img width="200" height="50" alt="HeadSpin" src="app/common/renderer/assets/images/headspin_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://www.browserstack.com/docs/app-automate/appium/integrations/appium-desktop">
        <img width="200" height="50" alt="BrowserStack" src="app/common/renderer/assets/images/browserstack_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://www.lambdatest.com/support/docs/appium-inspector-integration">
        <img width="200" height="50" alt="LambdaTest" src="app/common/renderer/assets/images/lambdatest_logo.svg">
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" valign="center">
      <a href="https://testingbot.com/support/getting-started/appium.html">
        <img width="200" height="50" alt="TestingBot" src="app/common/renderer/assets/images/testingbot_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://docs.digital.ai/bundle/TE/page/appium.html">
        <img width="200" height="50" alt="ExperiTest" src="app/common/renderer/assets/images/experitest_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://robotqa.com/appium-remote">
        <img width="200" height="50" alt="RobotQA" src="app/common/renderer/assets/images/robotqa_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://appkitbox.com/en/support/automation/appium/">
        <img width="200" height="50" alt="Remote TestKit" src="app/common/renderer/assets/images/remotetestkit_logo.svg">
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" valign="center">
      <a href="https://support.smartbear.com/bitbar/docs/en/mobile-app-tests/automated-testing/appium-support.html">
        <img width="200" height="50" alt="BitBar" src="app/common/renderer/assets/images/bitbar_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://docs.kobiton.com/automation-testing/basic-appium-server/launch-a-basic-appium-2-session">
        <img width="200" height="50" alt="Kobiton" src="app/common/renderer/assets/images/kobiton_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://help.perfecto.io/perfecto-help/content/perfecto/automation-testing/appium.htm">
        <img width="200" height="50" alt="Perfecto" src="app/common/renderer/assets/images/perfecto_logo.svg">
      </a>
    </td>
    <td align="center" valign="center">
      <a href="https://www.pcloudy.com/docs/inspect-element-using-appium-desktop">
        <img width="200" height="50" alt="Pcloudy" src="app/common/renderer/assets/images/pcloudy_logo.svg">
      </a>
    </td>
  </tr>
  <tr>
    <td align="center" valign="center">
      <a href="https://mobitru.com/docs/automation/">
        <img width="200" height="50" alt="Mobitru" src="app/common/renderer/assets/images/mobitru_logo.svg">
      </a>
    </td>
  </tr>
</table>

> [!NOTE]
>
> We may remove cloud providers if they no longer work properly with this inspector, as there is no compatibility.

## Reporting Issues

If you run into a problem, first check whether you can reproduce it _without_ the Inspector, by using a different Appium client.

- If the issue still exists, then it's _not_ an issue with the Inspector - report it at the [main Appium repo](https://github.com/appium/appium/issues)
- If the issue is gone, then it is likely specific to the Inspector -
  [please report it in this repo](https://github.com/appium/appium-inspector/issues/new?assignees=&labels=bug&projects=&template=bug_report.yml&title=bug%3A+%3Ctitle%3E)

## Development

Want to help us develop this app? Awesome! Please check the
[Contributing documentation](https://appium.github.io/appium-inspector/latest/contributing/) for details.

### Localization

Localization for the Inspector is provided by [Crowdin](https://crowdin.com/project/appium-desktop).
If you would like to help translate this app, please check the [Localization section](https://appium.github.io/appium-inspector/2023.12/contributing/#localization)
of the Contributing documentation.

## Version Schema

The Inspector's version schema is `<RELEASE_YEAR>.<RELEASE_MONTH_NUM>.<RELEASE_COUNT_FOR_MONTH>`.
For example, the first release in the month of April in the year 2022 would be `2022.4.1`, and the
10th in that month would be `2022.4.10`.
