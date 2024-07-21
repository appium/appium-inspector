import {startServer as startAppiumFakeDriverServer} from '@appium/fake-driver';
import path from 'path';
import {afterAll, beforeAll, describe, expect, it} from 'vitest';
import {Web2Driver} from 'web2driver/node';

import AppiumClient from '../../app/common/renderer/lib/appium-client';

const FAKE_DRIVER_PORT = 12121;

const FAKE_DRIVER_PATH = path.dirname(require.resolve('@appium/fake-driver/package.json'));
const TEST_APP = path.resolve(FAKE_DRIVER_PATH, 'test', 'fixtures', 'app.xml');

const DEFAULT_CAPS = {
  platformName: 'Fake',
  'appium:deviceName': 'Fake',
  'appium:app': TEST_APP,
};

describe('Appium client actions', function () {
  let driver, server, client;

  beforeAll(async function () {
    server = await startAppiumFakeDriverServer(FAKE_DRIVER_PORT, '127.0.0.1');
    driver = await Web2Driver.remote(
      {
        hostname: '127.0.0.1',
        port: FAKE_DRIVER_PORT,
        path: '/',
        connectionRetryCount: 0,
      },
      DEFAULT_CAPS,
    );
    client = AppiumClient.instance(driver);
  });
  afterAll(async function () {
    try {
      await driver.quit();
    } catch (ign) {}
    await server.close();
  });

  describe('.fetchElement, .fetchElements', function () {
    it('should return empty object if selector is null', async function () {
      const res = await client.fetchElement({strategy: 'xpath', selctor: '//BadXPath'});
      expect(res).toEqual({});
    });
    it('should fetchElement and cache it', async function () {
      const {id, variableName, variableType, strategy, selector} = await client.fetchElement({
        strategy: 'xpath',
        selector: '//MockListItem',
      });
      expect(id).toBeTruthy();
      expect(strategy).toBe('xpath');
      expect(selector).toBe('//MockListItem');
      expect(variableName).toBeUndefined(); // Shouldn't have a variable name until a method is performed on it
      expect(variableType).toBe('string');
      expect(client.elementCache[id]).toBeTruthy();
      expect(client.elementCache[id].variableName).toBeUndefined();
      expect(client.elementCache[id].variableType).toBe('string');
    });
    it('should fetchElements and cache all of them', async function () {
      const res = await client.fetchElements({strategy: 'xpath', selector: '//MockListItem'});
      expect(res.elements.length).toBeGreaterThan(0);
      expect(res.variableName).toBe('els1');
      expect(res.variableType).toBe('array');
      expect(res.elements[0].variableName).toBe('els1');
      expect(res.elements[0].variableType).toBe('string');
      expect(res.elements[0].id).toBeTruthy();
      expect(res.elements[1].variableName).toBe('els1');
      expect(res.elements[1].variableType).toBe('string');
      expect(res.elements[1].id).toBeTruthy();
      expect(res.strategy).toBe('xpath');
      expect(res.selector).toBe('//MockListItem');
      expect(client.elementCache[res.elements[0].id].variableName).toBe('els1');
      expect(client.elementCache[res.elements[0].id].variableType).toBe('string');
      expect(client.elementCache[res.elements[1].id].variableName).toBe('els1');
      expect(client.elementCache[res.elements[1].id].variableType).toBe('string');
    });
  });
  describe('.executeMethod', function () {
    it('should call the click method and have the variableName, variableType, etc... returned to it with source/screenshot', async function () {
      const {id, variableName, variableType} = await client.fetchElement({
        strategy: 'xpath',
        selector: '//MockListItem',
      });
      expect(variableName).toBeUndefined(); // Shouldn't have a cached variable name until a method is performed on it
      const {
        source,
        screenshot,
        variableName: repeatedVariableName,
        variableType: repeatedVariableType,
        id: repeatedId,
      } = await client.executeMethod({elementId: id, methodName: 'click'});
      expect(repeatedVariableName).toBeTruthy();
      expect(variableType).toBe(repeatedVariableType);
      expect(id).toBe(repeatedId);
      expect(source).toBeTruthy();
      expect(screenshot).toBeTruthy();
    });
    it('should call the click method and have the variableName, variableType, etc... returned to it with source/screenshot', async function () {
      const {elements} = await client.fetchElements({
        strategy: 'xpath',
        selector: '//MockListItem',
      });
      for (let element of elements) {
        const {id, variableName, variableType} = element;
        const {
          source,
          screenshot,
          variableName: repeatedVariableName,
          variableType: repeatedVariableType,
          id: repeatedId,
        } = await client.executeMethod({elementId: id, methodName: 'click'});
        expect(variableName).toBe(repeatedVariableName);
        expect(variableType).toBe(repeatedVariableType);
        expect(id).toBe(repeatedId);
        expect(source).toBeTruthy();
        expect(screenshot).toBeTruthy();
      }
    });
    it('should call "setGeolocation" method and get result plus source and screenshot', async function () {
      const res = await client.executeMethod({
        methodName: 'setGeoLocation',
        args: [{latitude: 100, longitude: 200, altitude: 0}],
      });
      expect(res.screenshot).toBeTruthy();
      expect(res.source).toBeTruthy();
      const getGeoLocationRes = await client.executeMethod({methodName: 'getGeoLocation'});
      expect(getGeoLocationRes.commandRes.latitude).toBe(100);
      expect(getGeoLocationRes.commandRes.longitude).toBe(200);
    });
  });
  describe('parseAndroidContexts methods', function () {
    it('should parse the android contexts into a proper format', async function () {
      const res = await client.parseAndroidContexts([
        {
          proc: '@webview_devtools_remote_8960',
          webview: 'WEBVIEW_8960',
          info: {
            'Android-Package': 'com.demoapp',
            Browser: 'Chrome/74.0.3729.185',
            'Protocol-Version': '1.3',
            'User-Agent': 'string',
            'V8-Version': 'string',
            'WebKit-Version': 'string',
            webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/browser',
          },
          pages: [
            {
              description:
                '{"attached":true,"empty":false,"height":1797,"screenX":0,"screenY":66,"visible":true,"width":1080}',
              devtoolsFrontendUrl: 'http://devtoolsFrontendUrl.com',
              faviconUrl: 'https://webdriver.io/img/logo-webdriver-io.png',
              id: '7E1BAB0FC5AD6947AFD8AADE88E0D89F',
              title: 'Demo app title',
              type: 'page',
              url: 'https://demoapp.com/',
              webSocketDebuggerUrl:
                'ws://127.0.0.1:10900/devtools/page/7E1BAB0FC5AD6947AFD8AADE88E0D89F',
            },
            {
              description: '',
              devtoolsFrontendUrl: 'http://devtoolsFrontendUrl.com',
              id: 'A503B9A60433B84A065D5F98250D3853',
              title: 'Service Worker title',
              type: 'service_worker',
              url: 'https://demoapp.com/sw.js?params=%7B%22offlineMode%22%3Afalse%2C%22debug%22%3Afalse%7D',
              webSocketDebuggerUrl:
                'ws://127.0.0.1:10900/devtools/page/A503B9A60433B84A065D5F98250D3853',
            },
          ],
          webviewName: 'WEBVIEW_com.demoapp',
        },
        {
          proc: '@chrome_devtools_remote',
          webview: 'WEBVIEW_chrome',
          info: {
            'Android-Package': 'com.android.chrome',
            Browser: 'string',
            'Protocol-Version': '1.3',
            'User-Agent': 'string',
            'V8-Version': 'string',
            'WebKit-Version': 'string',
            webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/browser',
          },
          pages: [
            {
              description: '',
              devtoolsFrontendUrl: 'http://devtoolsFrontendUrl.com',
              id: '1',
              title: 'Chrome tab 1',
              type: 'page',
              url: 'https://www.chrome.com/tab/1/',
              webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/1',
            },
            {
              description: '',
              devtoolsFrontendUrl: 'http://devtoolsFrontendUrl.com',
              id: '0',
              title: 'Chrome tab 0',
              type: 'page',
              url: 'https://www.chrome.com/tab/0/',
              webSocketDebuggerUrl: 'ws://127.0.0.1:10900/devtools/page/0',
            },
          ],
          webviewName: 'WEBVIEW_chrome',
        },
      ]);

      expect(res).toEqual([
        {
          id: 'NATIVE_APP',
        },
        {
          id: 'WEBVIEW_com.demoapp',
          title: 'Demo app title',
          url: 'https://demoapp.com/',
          packageName: 'com.demoapp',
          handle: '7E1BAB0FC5AD6947AFD8AADE88E0D89F',
        },
        {
          id: 'WEBVIEW_chrome',
          title: 'Chrome tab 1',
          url: 'https://www.chrome.com/tab/1/',
          packageName: 'com.android.chrome',
          handle: '1',
        },
        {
          id: 'WEBVIEW_chrome',
          title: 'Chrome tab 0',
          url: 'https://www.chrome.com/tab/0/',
          packageName: 'com.android.chrome',
          handle: '0',
        },
      ]);
    });
  });
});
