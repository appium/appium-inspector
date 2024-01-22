---
title: Server Details
---

The top of the Session Builder screen is used to configure server details - that is, how the
Inspector should connect to the target Appium server.

![Server Details](./assets/images/server-configuration.png)

By default, the _Appium Server_ tab is selected, which is used for connecting to a standalone local
or remote Appium server. However, it is also possible to connect to a server provided by a cloud
service. [See the section below for more details.](#cloud-providers)

## Default Server Detail Fields

The default server details have 4 fields:

![Default Server Details](./assets/images/default-server-details.png)

* __Remote Host__: the host URL of the server
* __Remote Port__: the port on which the server is running
* __Remote Path__: the path used to access the server. Appium 2 servers use `/` by default, whereas
  Appium 1 servers use `/wd/hub`
* __SSL__: by default, the server is accessed over HTTP - tick this checkbox to use HTTPS

If using the placeholder details, the Inspector will try to connect to `http://127.0.0.1:4723/`.
If you have a locally-running Appium 2 server that was launched with default parameters, it should
also be using this address, in which case you can leave the fields unchanged.

## Cloud Providers

Clicking the _Select Cloud Providers_ button opens a screen showing various cloud providers that
support integration through Appium Inspector:

![Cloud Providers](./assets/images/cloud-providers.png)

Currently, the Inspector supports the following cloud service providers:

| Platform                                    | Docs                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Sauce Labs](https://saucelabs.com)         | [Documentation](https://wiki.saucelabs.com/)                                          |
| [HeadSpin](https://headspin.io)             | [Documentation](https://headspin.io/)                                                 |
| [Browserstack](https://browserstack.com)    | [Documentation](https://www.browserstack.com/docs)                                    |
| [LambdaTest](https://lambdatest.com)        | [Documentation](https://www.lambdatest.com/support/docs/appium-inspector-integration) |
| [Bitbar](https://bitbar.com)                | [Documentation](http://docs.bitbar.com/)                                              |
| [Kobiton](https://kobiton.com)              | [Documentation](https://docs.kobiton.com/)                                            |
| [Perfecto](https://www.perfecto.io)         | [Documentation](https://developers.perfectomobile.com/display/PD/Appium)              |
| [Pcloudy](https://www.pcloudy.com)          | [Documentation](https://www.pcloudy.com/mobile-application-testing-documentation)     |
| [TestingBot](https://testingbot.com)        | [Documentation](https://testingbot.com/support)                                       |
| [Experitest](http://www.experitest.com)     | [Documentation](https://docs.experitest.com/display/TE/Appium)                        |
| [RobotQA](https://www.robotqa.com)          | [Documentation](https://robotqa.com/appium-remote)                                    |
| [Remote TestKit](https://appkitbox.com/en/) | [Documentation](https://appkitbox.com/en/support/automation/appium/)                  |
| [Mobitru](https://mobitru.com/)             | [Documentation](https://mobitru.com/docs/automation/)                                 |

Selecting any provider then adds a new tab next to the default _Appium Server_ tab, and switching to
the provider's tab changes the available server detail fields. Different providers will have
different fields - for example, LambdaTest only requires the _username_ and _access key_:

![LambdaTest Server Details](./assets/images/lambdatest-details.png)

## Advanced Settings

The _Advanced Settings_ options allow further configuration of the Appium server connection:

![Advanced Settings](./assets/images/advanced-settings.png)
