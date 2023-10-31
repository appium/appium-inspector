import _ from 'lodash';
import Bluebird from 'bluebird';
import { parseSource, setHtmlElementAttributes } from './webview-helpers';
import { SCREENSHOT_INTERACTION_MODE, APP_MODE } from '../components/Inspector/shared';

const { TAP, SWIPE, GESTURE } = SCREENSHOT_INTERACTION_MODE;

// Selector for the Android webview - includes the correct top and bottom boundaries
const ANDROID_WEBVIEW_SELECTOR = 'android.webkit.WebView';
// Selector for the iOS status bar and Safari address bar - not always present
const IOS_TOP_CONTROLS_SELECTOR = '**/XCUIElementTypeOther[`name CONTAINS "SafariWindow"`]' +
  '/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther/XCUIElementTypeOther[1]';

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


    let contextUpdate = {}, sourceUpdate = {}, screenshotUpdate = {}, windowSizeUpdate = {};
    if (!skipRefresh) {
      // Give the source/screenshot time to change before taking the screenshot
      await Bluebird.delay(500);
      if (!skipScreenshot) {
        screenshotUpdate = await this.getScreenshotUpdate();
      }
      windowSizeUpdate = await this.getWindowUpdate();
      // only do context updates if user has selected web/hybrid mode (takes forever)
      if (appMode === APP_MODE.WEB_HYBRID) {
        contextUpdate = await this.getContextUpdate(windowSizeUpdate);
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
    const start = Date.now();
    const els = await this.driver.findElements(strategy, selector);
    const executionTime = Date.now() - start;

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

    return {
      variableName,
      variableType,
      strategy,
      selector,
      elements: elementList,
      executionTime,
    };
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
    const {client: {capabilities: {deviceScreenSize, platformName, automationName}}} = this.driver;
    try {
      windowSize = await this.driver.getWindowRect();
      if (_.toLower(platformName) === 'android' && _.toLower(automationName) === 'uiautomator2') {
        // returned Android height and width can both be affected by UiAutomator2 calculations
        // we stick with device dimensions, but swap them depending on detected orientation
        // deviceScreenSize value fits portrait mode for phones, but landscape mode for tablets
        const [width, height] = deviceScreenSize.split('x');
        if ((windowSize.height > windowSize.width && height > width) || // phone portrait mode
            (windowSize.height < windowSize.width && height < width)) { // tablet landscape mode
          windowSize.height = height;
          windowSize.width = width;
        } else { // phone landscape mode / tablet portrait mode
          windowSize.height = width;
          windowSize.width = height;
        }
      }
    } catch (e) {
      windowSizeError = e;
    }

    return {windowSize, windowSizeError};
  }

  // Retrieve all detected contexts, as well as the current context
  // If retrieval of either one fails, return the error(s)
  // Additionally, if webview is used, adjust the found element positions to fit screenshot
  // Only called while in hybrid mode
  async getContextUpdate ({ windowSize }) {
    let contexts, contextsError, currentContext, currentContextError, webviewTopOffset;
    let webviewLeftOffset = 0;

    if (!await this.hasContextsCommand()) {
      return {currentContext: null, contexts: []};
    }

    // First get the current context (or the error, if one appears)
    try {
      currentContext = await this.driver.getContext();
    } catch (e) {
      currentContextError = e;
    }

    // The retrieval of all contexts and webview position adjustments require some native context use
    if (currentContext !== NATIVE_APP) {
      await this.driver.switchContext(NATIVE_APP);
    }

    const sessionDetails = await this.driver.getSession();
    const isAndroid = this.driver.client.isAndroid;

    // Get all available contexts (or the error, if one appears)
    try {
      contexts = await this.driver.executeScript('mobile:getContexts', []);
      contexts = isAndroid ? this.parseAndroidContexts(contexts) : contexts;
    } catch (e) {
      contextsError = e;
    }

    // For webview context, the viewport needs to be recalculated
    // to account for any top and left offsets
    if (currentContext !== NATIVE_APP) {
      if (isAndroid) {
        // on Android, find the root webview element and use its X and Y startpoints
        const webview = await this.fetchElement({strategy: 'class name', selector: ANDROID_WEBVIEW_SELECTOR});
        if (webview.el) {
          const { x, y } = await webview.el.getRect();
          webviewTopOffset = y;
          webviewLeftOffset = x;
        } else {
          // fallback to default top offset value if element retrieval failed
          try {
            const systemBars = await this.driver.executeScript('mobile:getSystemBars', []);
            webviewTopOffset = systemBars.statusBar.height;
          } catch (e) {
            // in case driver does not support mobile:getSystemBars
            webviewTopOffset = sessionDetails.viewportRect.top;
          }
        }
      } else if (this.driver.client.isIOS) {
        // on iOS, find the top status bar and address bar and use its Y endpoint
        const topBar = await this.fetchElement({strategy: '-ios class chain', selector: IOS_TOP_CONTROLS_SELECTOR});
        if (topBar.el) {
          const { y, height } = await topBar.el.getRect();
          webviewTopOffset = y + height;
        }
        // in landscape mode, there is empty space on both sides (at default zoom level), so add offset for that too
        if (windowSize.height < windowSize.width) {
          try {
            const deviceScreenInfo = await this.driver.executeScript('mobile:deviceScreenInfo', []);
            webviewLeftOffset = deviceScreenInfo.statusBarSize.height;
          } catch (e) {
            // in case driver does not support mobile:deviceScreenInfo
            webviewLeftOffset = sessionDetails.statBarHeight;
          }
        }
      }

      // if not using iOS or Android, or if iOS element retrieval failed for any reason
      // (e.g. bars can be hidden), fallback to default value for the top offset
      if (webviewTopOffset === undefined) {
        webviewTopOffset = 0;
      }

      // Native context calculation part is done - switch back to webview context
      await this.driver.switchContext(currentContext);

      // Adjust all elements by the calculated offsets
      await this.driver.executeScript(
        `return (${setHtmlElementAttributes}).apply(null, arguments)`,
        [{isAndroid, webviewTopOffset, webviewLeftOffset}],
      );
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
