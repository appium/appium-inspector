import {describe, expect, it} from 'vitest';

import {SERVER_TYPES} from '../../app/common/renderer/constants/session-builder';
import {
  formatSeleniumGridSessions,
  getSessionInfo,
} from '../../app/common/renderer/utils/attaching-to-session';

describe('utils/attaching-to-session.js', function () {
  describe('#getSessionInfo', function () {
    it('should show correct info if all expected parameters are defined', function () {
      const session = {
        id: '12345',
        capabilities: {
          sessionName: 'Vitest Session',
          deviceName: 'Vitest Phone',
          platformName: 'Android',
          platformVersion: '100',
          automationName: 'UiAutomator2',
          app: 'bestapp.apk',
        },
      };
      const serverType = SERVER_TYPES.HEADSPIN;
      expect(getSessionInfo(session, serverType)).toEqual(
        '12345 — Vitest Session / Vitest Phone / Android 100 / UiAutomator2 / bestapp.apk',
      );
    });
    it('should show correct info if some expected parameters are missing', function () {
      const session = {
        id: '12345',
        capabilities: {
          udid: 'AAAAA-BBBBB',
          platformName: 'Android',
          automationName: 'UiAutomator2',
          appPackage: 'com.best.app',
        },
      };
      const serverType = SERVER_TYPES.LOCAL;
      expect(getSessionInfo(session, serverType)).toEqual(
        '12345 — AAAAA-BBBBB / Android / UiAutomator2 / com.best.app',
      );
    });
    it('should show correct info for LambdaTest-specific capability format', function () {
      const session = {
        id: '12345',
        capabilities: {
          capabilities: {
            desired: {
              deviceName: 'Vitest Phone',
            },
            sessionName: 'Vitest Session',
            platformName: 'Android',
            platformVersion: '100',
            automationName: 'UiAutomator2',
            app: 'bestapp.apk',
          },
        },
      };
      const serverType = SERVER_TYPES.LAMBDATEST;
      expect(getSessionInfo(session, serverType)).toEqual(
        '12345 — Vitest Session / Vitest Phone / Android 100 / UiAutomator2 / bestapp.apk',
      );
    });
  });

  describe('#formatSeleniumGridSessions', function () {
    it('should not find invalid sessions', function () {
      expect(formatSeleniumGridSessions({data: {value: {}}})).toEqual([]);
      expect(formatSeleniumGridSessions({data: {value: {nodes: []}}})).toEqual([]);
      expect(formatSeleniumGridSessions({data: {value: {nodes: [{}]}}})).toEqual([]);
      expect(formatSeleniumGridSessions({data: {value: {nodes: [{slots: []}]}}})).toEqual([]);
      expect(formatSeleniumGridSessions({data: {value: {nodes: [{slots: [{}]}]}}})).toEqual([]);
      expect(
        formatSeleniumGridSessions({data: {value: {nodes: [{slots: [{session: {}}]}]}}}),
      ).toEqual([]);
      expect(
        formatSeleniumGridSessions({
          data: {value: {nodes: [{slots: [{session: {capabilities: {}}}]}]}},
        }),
      ).toEqual([]);
    });
    it('should find and format an Appium session', function () {
      expect(
        formatSeleniumGridSessions({
          data: {
            value: {
              nodes: [
                {
                  slots: [
                    {
                      session: {
                        capabilities: {
                          'appium:automationName': 'UiAutomator2',
                          desired: {platformName: 'Android', app: 'bestapp.apk'},
                        },
                        sessionId: '12345',
                      },
                    },
                  ],
                },
              ],
            },
          },
        }),
      ).toEqual([
        {
          id: '12345',
          capabilities: {
            platformName: 'Android',
            app: 'bestapp.apk',
          },
        },
      ]);
    });
    it('should not find non-Appium sessions', function () {
      expect(
        formatSeleniumGridSessions({
          data: {
            value: {
              nodes: [
                {
                  slots: [
                    {
                      session: {
                        capabilities: {
                          browserName: 'Chrome',
                          desired: {platformName: 'macOS', browserName: 'Chrome'},
                          platformName: 'macOS',
                        },
                        sessionId: '12345',
                      },
                    },
                  ],
                },
              ],
            },
          },
        }),
      ).toEqual([]);
    });
    it('should find and format Appium sessions across multiple Grid nodes and slots', function () {
      expect(
        formatSeleniumGridSessions({
          data: {
            value: {
              nodes: [
                {
                  slots: [
                    {
                      session: {
                        capabilities: {
                          'appium:automationName': 'UiAutomator2',
                          desired: {platformName: 'Android', app: 'bestapp.apk'},
                        },
                        sessionId: '12345',
                      },
                    },
                    {
                      session: {
                        capabilities: {
                          'appium:automationName': 'XCUITest',
                          desired: {platformName: 'iOS', app: 'bestapp.ipa'},
                        },
                        sessionId: '54321',
                      },
                    },
                  ],
                },
                {
                  slots: [
                    {
                      session: {
                        capabilities: {
                          'appium:automationName': 'UiAutomator2',
                          desired: {platformName: 'Android', app: 'secondbestapp.apk'},
                        },
                        sessionId: '123456',
                      },
                    },
                    {
                      session: {
                        capabilities: {
                          'appium:automationName': 'XCUITest',
                          desired: {platformName: 'iOS', app: 'secondbestapp.ipa'},
                        },
                        sessionId: '654321',
                      },
                    },
                  ],
                },
              ],
            },
          },
        }),
      ).toEqual([
        {
          id: '12345',
          capabilities: {
            platformName: 'Android',
            app: 'bestapp.apk',
          },
        },
        {
          id: '54321',
          capabilities: {
            platformName: 'iOS',
            app: 'bestapp.ipa',
          },
        },
        {
          id: '123456',
          capabilities: {
            platformName: 'Android',
            app: 'secondbestapp.apk',
          },
        },
        {
          id: '654321',
          capabilities: {
            platformName: 'iOS',
            app: 'secondbestapp.ipa',
          },
        },
      ]);
    });
  });
});
