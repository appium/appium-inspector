import {startServer as startAppiumFakeDriverServer} from '@appium/fake-driver';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import {Web2Driver} from 'web2driver/node';

import AppiumClient from '../../app/renderer/lib/appium-client';

const should = chai.should();
chai.use(chaiAsPromised);

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

  before(async function () {
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
  after(async function () {
    try {
      await driver.quit();
    } catch (ign) {}
    await server.close();
  });

  describe('.fetchElement, .fetchElements', function () {
    it('should return empty object if selector is null', async function () {
      const res = await client.fetchElement({strategy: 'xpath', selctor: '//BadXPath'});
      res.should.deep.equal({});
    });
    it('should fetchElement and cache it', async function () {
      const {id, variableName, variableType, strategy, selector} = await client.fetchElement({
        strategy: 'xpath',
        selector: '//MockListItem',
      });
      id.should.exist;
      strategy.should.equal('xpath');
      selector.should.equal('//MockListItem');
      should.not.exist(variableName); // Shouldn't have a variable name until a method is performed on it
      variableType.should.equal('string');
      client.elementCache[id].should.exist;
      should.not.exist(client.elementCache[id].variableName);
      client.elementCache[id].variableType.should.equal('string');
    });
    it('should fetchElements and cache all of them', async function () {
      const res = await client.fetchElements({strategy: 'xpath', selector: '//MockListItem'});
      res.elements.length.should.be.above(0);
      res.variableName.should.equal('els1');
      res.variableType.should.equal('array');
      res.elements[0].variableName.should.equal('els1');
      res.elements[0].variableType.should.equal('string');
      res.elements[0].id.should.exist;
      res.elements[1].variableName.should.equal('els1');
      res.elements[1].variableType.should.equal('string');
      res.elements[1].id.should.exist;
      res.strategy.should.equal('xpath');
      res.selector.should.equal('//MockListItem');
      client.elementCache[res.elements[0].id].variableName.should.equal('els1');
      client.elementCache[res.elements[0].id].variableType.should.equal('string');
      client.elementCache[res.elements[1].id].variableName.should.equal('els1');
      client.elementCache[res.elements[1].id].variableType.should.equal('string');
    });
  });
  describe('.executeMethod', function () {
    it('should call the click method and have the variableName, variableType, etc... returned to it with source/screenshot', async function () {
      const {id, variableName, variableType} = await client.fetchElement({
        strategy: 'xpath',
        selector: '//MockListItem',
      });
      should.not.exist(variableName); // Shouldn't have a cached variable name until a method is performed on it
      const {
        source,
        screenshot,
        variableName: repeatedVariableName,
        variableType: repeatedVariableType,
        id: repeatedId,
      } = await client.executeMethod({elementId: id, methodName: 'click'});
      repeatedVariableName.should.exist;
      variableType.should.equal(repeatedVariableType);
      id.should.equal(repeatedId);
      source.should.exist;
      screenshot.should.exist;
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
        variableName.should.equal(repeatedVariableName);
        variableType.should.equal(repeatedVariableType);
        id.should.equal(repeatedId);
        source.should.exist;
        screenshot.should.exist;
      }
    });
    it('should call "setGeolocation" method and get result plus source and screenshot', async function () {
      const res = await client.executeMethod({
        methodName: 'setGeoLocation',
        args: [{latitude: 100, longitude: 200, altitude: 0}],
      });
      res.screenshot.should.exist;
      res.source.should.exist;
      const getGeoLocationRes = await client.executeMethod({methodName: 'getGeoLocation'});
      getGeoLocationRes.commandRes.latitude.should.equal(100);
      getGeoLocationRes.commandRes.longitude.should.equal(200);
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

      res.should.eql([
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
