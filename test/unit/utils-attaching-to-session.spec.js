import {describe, expect, it} from 'vitest';

import {SERVER_TYPES} from '../../app/common/renderer/constants/session-builder';
import {getSessionInfo} from '../../app/common/renderer/utils/attaching-to-session';

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
});
