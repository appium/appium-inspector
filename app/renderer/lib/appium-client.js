import _ from 'lodash';
import Bluebird from 'bluebird';
import {getWebviewStatusAddressBarHeight, parseSource, setHtmlElementAttributes} from './webview-helpers';
import {SCREENSHOT_INTERACTION_MODE, APP_MODE} from '../components/Inspector/shared';

const {TAP, SWIPE, GESTURE} = SCREENSHOT_INTERACTION_MODE;

export const NATIVE_APP = 'NATIVE_APP';
let _instance = null;

export default class AppiumClient {
  constructor (driver) {
    this.driver = driver;
    this.elementCache = {};
    this.elVarCount = 0;
    this.elArrayVarCount = 0;
  }

  async run (params) {
    const {
      methodName, // Optional. Name of method being provided
      strategy, // Optional. Element locator strategy
      selector, // Optional. Element fetch selector
      fetchArray = false, // Optional. Are we fetching an array of elements or just one?
      elementId, // Optional. Element being operated on
      args = [], // Optional. Arguments passed to method
      skipRefresh = false, // Optional. Do we want the updated source and screenshot?
      skipScreenshot = false, // Optional. Do we want to skip getting screenshot alone?
      appMode = APP_MODE.NATIVE, // Optional. Whether we're in a native or hybrid mode
    } = params;

    if (methodName === 'quit') {
      try {
        await this.driver.quit();
      } catch (ign) {
      }

      _instance = null;

      // when we've quit the session, there's no source/screenshot to send
      // back
      return {
        source: null,
        screenshot: null,
        windowSize: null,
        result: null
      };
    }

    let res = {};
    if (methodName) {
      if (elementId) {
        console.log(`Handling client method request with method '${methodName}', args ${JSON.stringify(args)} and elementId ${elementId}`); // eslint-disable-line no-console
        res = await this.executeMethod({elementId, methodName, args, skipRefresh, skipScreenshot, appMode});
      } else {
        console.log(`Handling client method request with method '${methodName}' and args ${JSON.stringify(args)}`); // eslint-disable-line no-console
        res = await this.executeMethod({methodName, args, skipRefresh, skipScreenshot, appMode});
      }
    } else if (strategy && selector) {
      if (fetchArray) {
        console.log(`Fetching elements with selector '${selector}' and strategy ${strategy}`); // eslint-disable-line no-console
        res = await this.fetchElements({strategy, selector});
      } else {
        console.log(`Fetching an element with selector '${selector}' and strategy ${strategy}`); // eslint-disable-line no-console
        res = await this.fetchElement({strategy, selector});
      }
    }

    return res;
  }

  async executeMethod ({elementId, methodName, args, skipRefresh, skipScreenshot, appMode}) {
    let cachedEl;
    let res = {};
    if (!_.isArray(args) && !_.isUndefined(args)) {
      args = [args];
    }

    if (elementId) {
      // Give the cached element a variable name (el1, el2, el3,...) the first time it's used
      cachedEl = this.elementCache[elementId];

      if (!cachedEl.variableName) {
        // now that we are actually going to use this element, let's assign it a variable name
        // if it doesn't already have one
        this.elVarCount += 1;
        cachedEl.variableName = `el${this.elVarCount}`;
      }

      // and then execute whatever method we requested on the actual element
      res = await cachedEl.el[methodName].apply(cachedEl.el, args);
    } else {
      // Specially handle the tap and swipe method
      if ([TAP, SWIPE, GESTURE].includes(methodName)) {
        const actions = Object.keys(args[0]).map((key) => (
          {
            type: 'pointer',
            id: key,
            parameters: {pointerType: 'touch'},
            actions: args[0][key]
          }));
        res = await this.driver.performActions(actions);
      } else if (methodName !== 'getPageSource' && methodName !== 'takeScreenshot') {
        res = await this.driver[methodName].apply(this.driver, args);
      }
    }

    // Give the source/screenshot time to change before taking the screenshot
    await Bluebird.delay(500);

    let contextUpdate = {}, sourceUpdate = {}, screenshotUpdate = {}, windowSizeUpdate = {};
    if (!skipRefresh) {
      if (!skipScreenshot) {
        screenshotUpdate = await this.getScreenshotUpdate();
      }
      windowSizeUpdate = await this.getWindowUpdate();
      // only do context updates if user has selected web/hybrid mode (takes forever)
      if (appMode === APP_MODE.WEB_HYBRID) {
        contextUpdate = await this.getContextUpdate();
      }
      sourceUpdate = await this.getSourceUpdate();
    }
    return {
      ...cachedEl,
      ...contextUpdate,
      ...sourceUpdate,
      ...screenshotUpdate,
      ...windowSizeUpdate,
      commandRes: res,
    };
  }

  async fetchElements ({strategy, selector}) {
    const els = await this.driver.findElements(strategy, selector);

    this.elArrayVarCount += 1;
    const variableName = `els${this.elArrayVarCount}`;
    const variableType = 'array';

    const elements = {};
    // Cache the elements that we find
    const elementList = els.map((el, index) => {
      const res = {
        el,
        variableName,
        variableIndex: index,
        variableType: 'string',
        id: el.elementId,
        strategy,
        selector,
      };
      elements[el.elementId] = res;
      return res;
    });

    this.elementCache = {...this.elementCache, ...elements};

    return {variableName, variableType, strategy, selector, elements: elementList};
  }

  async fetchElement ({strategy, selector}) {
    const start = Date.now();
    let element = null;
    try {
      element = await this.driver.findElement(strategy, selector);
    } catch (err) {
      return {};
    }

    const executionTime = Date.now() - start;

    const id = element.elementId;

    // Cache this ID along with its variable name, variable type and strategy/selector
    const elementData = {
      el: element,
      variableType: 'string',
      strategy,
      selector,
      id,
    };

    this.elementCache[id] = elementData;

    return {
      ...elementData,
      executionTime,
    };
  }

  async getWindowUpdate () {
    let windowSize, windowSizeError;
    const {client: {capabilities: {deviceScreenSize, platformName}}} = this.driver;
    try {
      // The call doesn't need to be made for Android for two reasons
      // - when appMode is hybrid Chrome driver doesn't know this command
      // - the data is already on the driver
      if (_.toLower(platformName) === 'android') {
        const [width, height] = deviceScreenSize.split('x');
        windowSize = {width, height, x: 0, y: 0};
      } else {
        windowSize = await this.driver.getWindowRect();
      }
    } catch (e) {
      windowSizeError = e;
    }

    return {windowSize, windowSizeError};
  }

  async getContextUpdate () {
    let contexts,
        contextsError,
        currentContext,
        currentContextError,
        pixelRatio,
        platformName,
        statBarHeight,
        viewportRect,
        webViewPosition;
    if (!await this.hasContextsCommand()) {
      return {currentContext: null, contexts: []};
    }

    try {
      currentContext = await this.driver.getContext();
    } catch (e) {
      currentContextError = e;
    }

    // Note: These methods need to be executed in the native context because ChromeDriver behaves differently
    if (currentContext !== NATIVE_APP) {
      await this.driver.switchContext(NATIVE_APP);
    }

    ({platformName, pixelRatio, statBarHeight, viewportRect} = await this.driver.getSession());
    const isAndroid = _.toLower(platformName) === 'android';

    try {
      contexts = await this.driver.executeScript('mobile:getContexts', []);
      contexts = isAndroid ? this.parseAndroidContexts(contexts) : contexts;
    } catch (e) {
      contextsError = e;
    }


    if (currentContext !== NATIVE_APP) {
      try {
        // Get the webview offset
        if (viewportRect) {
          // The viewport rectangles are based on the screen density,
          // iOS needs CSS pixels
          webViewPosition = {
            x: isAndroid ? viewportRect.left : Math.round(viewportRect.left / pixelRatio),
            y: isAndroid ? viewportRect.top : Math.round(viewportRect.top / pixelRatio),
          };
        } else {
          // Fallback
          const el = await this.driver.findElement(
            isAndroid ? 'xpath' : '-ios class chain',
            isAndroid ? '//android.webkit.WebView' : '**/XCUIElementTypeWebView'
          );
          if (el) {
            webViewPosition = await el.getRect();
          }
        }
      } catch (ign) {
      }
      await this.driver.switchContext(currentContext);
    }

    /**
     * If its a webview then update the HTML with the element location
     * so the source can be used in the native inspector
     */
    try {
      if (currentContext !== NATIVE_APP) {
        // Fallback if the webview position can't be determined,
        // then do it based on the web context
        if (!webViewPosition) {
          webViewPosition = {
            x: 0,
            y: await this.driver.executeScript(
              `return (${getWebviewStatusAddressBarHeight}).apply(null, arguments)`,
              [{platformName, statBarHeight}],
            ),
          };
        }
        await this.driver.executeScript(
          `return (${setHtmlElementAttributes}).apply(null, arguments)`,
          [{platformName, webviewStatusAddressBarHeight: webViewPosition.y}],
        );
      }
    } catch (ign) {
    }

    return {contexts, contextsError, currentContext, currentContextError};
  }

  async getSourceUpdate () {
    try {
      const source = parseSource(await this.driver.getPageSource());
      return {source};
    } catch (err) {
      return {sourceError: err};
    }
  }

  async getScreenshotUpdate () {
    try {
      const screenshot = await this.driver.takeScreenshot();
      return {screenshot};
    } catch (err) {
      return {screenshotError: err};
    }
  }

  /**
   * If the app under test can return contexts command.
   *
   * @returns {boolean} True if the app under test supports contexts command.
   *
   */
  async hasContextsCommand () {
    try {
      await this.driver.getContexts();
      return true;
    } catch (ign) {
    }

    // If the app under test returns non JSON format response
    return false;
  }

  /**
   * Parse the Android contexts webview data
   *
   * Returns
   * {
   *   id: string;             // NATIVE_APP or the webview name
   *   title?: string;         // the name of the page
   *   url?: string;           // the url
   *   bundleId?: string;      // for iOS
   *   packageName?: string;   // for Android
   *   handle?: string;        // the id of the active page in the webview of Android
   * }[];
   */
  parseAndroidContexts (contexts) {
    const parsedWebviews = [];

    // Walk over every context and add all webviews into the parsedWebviews array
    contexts
      // Filter out all contexts that have a webviewName
      .filter((webview) => _.has(webview, 'webviewName'))
      // Now construct a new array with data
      .map(({info, pages, webviewName}) => {
        // The context result can have:
        // - no pages => this might be Chrome running in the background
        // - pages => this can be:
        //   - Chrome with one or multiple tabs open
        //   - A webview with one or multiple webviews
        if (!pages) {
          return;
        }

        pages.filter((page) => {
          // The description is a string and:
          // 1. can contain a JSON string for webviews which can contain
          //    an `attached`-value telling if the webview is active
          // 2. can be an empty string, this is most of the times for tabs
          //    in Chrome
          const description = _.has(page, 'description') ? page.description : '';
          let descriptionJSON = {attached: false};
          try {
            descriptionJSON = JSON.parse(page.description);
          } catch (ign) {}

          // You can have multiple `type` of pages, like service workers
          // We need to have pages with or 1. an attached view or 2. with an empty description
          return page.type === 'page' && (description === '' || descriptionJSON.attached);
        })
          .map((page) => {
            parsedWebviews.push({
              id: webviewName,
              ...(page && _.has(page, 'title') ? {title: page.title} : {}),
              ...(page && _.has(page, 'url') ? {url: page.url} : {}),
              ...(page && _.has(info, 'Android-Package') ? {packageName: info['Android-Package']} : {}),
              ...(page && _.has(page, 'id') ? {handle: page.id} : {}),
            });
          });

        return parsedWebviews;
      });

    return [
      // The Android contexts dont have the `NATIVE_APP` context so add it here
      {id: 'NATIVE_APP'},
      // Add the parsedWebviews, but make sure to filter out all undefined webviews
      ...parsedWebviews.filter(Boolean),
    ];
  }
}

AppiumClient.instance = (driver) => {
  if (_instance === null) {
    _instance = new AppiumClient(driver);
  }
  return _instance;
};
