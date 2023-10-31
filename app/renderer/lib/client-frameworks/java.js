import Framework from './framework';
import _ from 'lodash';

class JavaFramework extends Framework {

  get language () {
    return 'java';
  }

  wrapWithBoilerplate (code) {
    let [pkg, cls] = (() => {
      if (this.caps.platformName) {
        switch (this.caps.platformName.toLowerCase()) {
          case 'ios': return ['ios', 'IOSDriver'];
          case 'android': return ['android', 'AndroidDriver'];
          case 'windows': return ['windows', 'WindowsDriver'];
          case 'mac2': return ['mac', 'Mac2Driver'];
          case 'gecko': return ['gecko', 'GeckoDriver'];
          case 'safari': return ['safari', 'SafariDriver'];
          default: return ['unknownPlatform', 'UnknownDriver'];
        }
      } else {
        return ['unknownPlatform', 'UnknownDriver'];
      }
    })();
    let capStr = this.indent(Object.keys(this.caps).map((k) => `.amend(${JSON.stringify(k)}, ${JSON.stringify(this.caps[k])})`).join('\n'), 6);
    // Import everything from Selenium in order to use WebElement, Point and other classes.
    return `
// This sample code supports Appium Java client >=9
// https://github.com/appium/java-client
import io.appium.java_client.remote.options.BaseOptions;
import io.appium.java_client.${pkg}.${cls};
import java.net.URL;
import java.time.Duration;
import java.util.Arrays;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openqa.selenium.*;

public class SampleTest {

  private ${cls} driver;

  @Before
  public void setUp() {
    var options = new BaseOptions()
${capStr};

    private URL getUrl() {
      try {
        return new URL("${this.serverUrl}");
      } catch (MalformedURLException e) {
        e.printStackTrace();
      }
    }

    driver = new ${cls}(this.getUrl(), options);
  }

  @Test
  public void sampleTest() {
${this.indent(code, 4)}
  }

  @After
  public void tearDown() {
    driver.quit();
  }
}
`;
  }

  codeFor_findAndAssign (strategy, locator, localVar, isArray) {
    let suffixMap = {
      xpath: 'xpath',
      'accessibility id': 'accessibilityId',
      id: 'id',
      'class name': 'className',
      name: 'name',
      '-android uiautomator': 'androidUIAutomator',
      '-android datamatcher': 'androidDataMatcher',
      '-android viewtag': 'androidViewTag',
      '-ios predicate string': 'iOSNsPredicateString',
      '-ios class chain': 'iOSClassChain',
    };
    if (!suffixMap[strategy]) {
      throw new Error(`Code generation for location strategy '${strategy}' is not currently supported`);
    }
    if (isArray) {
      return `var ${localVar} = driver.findElements(AppiumBy.${suffixMap[strategy]}(${JSON.stringify(locator)}));`;
    } else {
      return `var ${localVar} = driver.findElement(AppiumBy.${suffixMap[strategy]}(${JSON.stringify(locator)}));`;
    }
  }

  getVarName (varName, varIndex) {
    if (varIndex || varIndex === 0) {
      return `${varName}.get(${varIndex})`;
    }
    return varName;
  }

  codeFor_click (varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.click();`;
  }

  codeFor_clear (varName, varIndex) {
    return `${this.getVarName(varName, varIndex)}.clear();`;
  }

  codeFor_sendKeys (varName, varIndex, text) {
    return `${this.getVarName(varName, varIndex)}.sendKeys(${JSON.stringify(text)});`;
  }

  codeFor_tap (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);
    return `
final var finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
var tapPoint = new Point(${x}, ${y});
var tap = new Sequence(finger, 1);
tap.addAction(finger.createPointerMove(Duration.ofMillis(0),
    PointerInput.Origin.viewport(), tapPoint.x, tapPoint.y));
tap.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
tap.addAction(new Pause(finger, Duration.ofMillis(50)));
tap.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
driver.perform(Arrays.asList(tap));
    `;
  }

  codeFor_swipe (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);
    return `
final var finger = new PointerInput(PointerInput.Kind.TOUCH, "finger");
var start = new Point(${x1}, ${y1});
var end = new Point (${x2}, ${y2});
var swipe = new Sequence(finger, 1);
swipe.addAction(finger.createPointerMove(Duration.ofMillis(0),
    PointerInput.Origin.viewport(), start.getX(), start.getY()));
swipe.addAction(finger.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
swipe.addAction(finger.createPointerMove(Duration.ofMillis(1000),
    PointerInput.Origin.viewport(), end.getX(), end.getY()));
swipe.addAction(finger.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
driver.perform(Arrays.asList(swipe));
  `;
  }

  // Execute Script

  codeFor_executeScript (varNameIgnore, varIndexIgnore, scriptCmd, jsonArg) {
    let assembledCommand;
    if (jsonArg === undefined) {
      assembledCommand = `driver.executeScript("${scriptCmd}");`;
    } else {
      // change the JSON object into a format accepted by Map.ofEntries: a sequence of Map.entry(key, value)
      // first create an array for each key-value pair
      const argsValuesArray = _.toPairs(JSON.parse(jsonArg));
      // then wrap each key-value array in Map.entry()
      const argsValuesStrings = argsValuesArray.map((kv) => `Map.entry(${JSON.stringify(kv).slice(1, -1)})`);
      assembledCommand = `driver.executeScript("${scriptCmd}", Map.ofEntries(${argsValuesStrings.join(', ')}));`;
    }
    return assembledCommand;
  }

  // App Management

  codeFor_startActivity (varNameIgnore, varIndexIgnore, ...args) {
    const argNames = ['appPackage', 'appActivity', 'appWaitPackage', 'intentAction', 'intentCategory',
      'intentFlags', 'optionalIntentArguments', 'dontStopAppOnReset'];
    // zip argument names and values into a JSON object, so that we can reuse executeScript
    const argsJsonObject = _.zipObject(argNames, args);
    // filter out arguments with no values, then stringify the JSON object
    const argsJsonString = JSON.stringify(_.omitBy(argsJsonObject, _.isUndefined));
    return this.codeFor_executeScript(varNameIgnore, varIndexIgnore, 'mobile: startActivity', argsJsonString);
  }

  codeFor_getCurrentActivity () {
    return `var activityName = driver.currentActivity();`;
  }

  codeFor_getCurrentPackage () {
    return `var packageName = driver.currentPackage();`;
  }

  codeFor_installApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.installApp("${app}");`;
  }

  codeFor_isAppInstalled (varNameIgnore, varIndexIgnore, app) {
    return `var isAppInstalled = driver.isAppInstalled("${app}");`;
  }

  codeFor_background (varNameIgnore, varIndexIgnore, timeout) {
    return `driver.runAppInBackground(Duration.ofSeconds(${timeout}));`;
  }

  codeFor_activateApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.activateApp("${app}");`;
  }

  codeFor_terminateApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.terminateApp("${app}");`;
  }

  codeFor_removeApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.removeApp("${app}");`;
  }

  codeFor_getStrings (varNameIgnore, varIndexIgnore, language, stringFile) {
    return `var appStrings = driver.getAppStringMap(${language ? `${language}, ` : ''}${stringFile ? `"${stringFile}` : ''});`;
  }

  // Clipboard

  codeFor_getClipboard () {
    return `var clipboardText = driver.getClipboardText();`;
  }

  codeFor_setClipboard (varNameIgnore, varIndexIgnore, clipboardText) {
    return `driver.setClipboardText("${clipboardText}");`;
  }

  // File Transfer


  codeFor_pushFile (varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `driver.pushFile("${pathToInstallTo}", ${fileContentString});`;
  }

  codeFor_pullFile (varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `var fileBase64 = driver.pullFile("${pathToPullFrom}");`;
  }

  codeFor_pullFolder (varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `var folderBase64 = driver.pullFolder("${folderToPullFrom}");`;
  }

  // Device Interaction

  codeFor_shake () {
    return `driver.shake();`;
  }

  codeFor_lock (varNameIgnore, varIndexIgnore, seconds) {
    return `driver.lockDevice(${seconds});`;
  }

  codeFor_unlock () {
    return `driver.unlockDevice();`;
  }

  codeFor_isLocked () {
    return `var isLocked = driver.isDeviceLocked();`;
  }

  codeFor_rotateDevice (varNameIgnore, varIndexIgnore, x, y, radius, rotation, touchCount, duration) {
    return `driver.rotate(new DeviceRotation(${x}, ${y}, ${radius}, ${rotation}, ${touchCount}, ${duration}));`;
  }

  codeFor_fingerprint (varNameIgnore, varIndexIgnore, fingerprintId) {
    return `driver.fingerPrint(${fingerprintId});`;
  }

  codeFor_touchId (varNameIgnore, varIndexIgnore, match) {
    return `driver.performTouchID(${match});`;
  }

  codeFor_toggleEnrollTouchId (varNameIgnore, varIndexIgnore, enroll) {
    return `driver.toggleTouchIDEnrollment(${enroll});`;
  }

  // Keyboard

  codeFor_pressKeyCode (varNameIgnore, varIndexIgnore, keyCode, metaState, flags) {
    return `driver.pressKeyCode(${keyCode}, ${metaState}, ${flags});`;
  }

  codeFor_longPressKeyCode (varNameIgnore, varIndexIgnore, keyCode, metaState, flags) {
    return `driver.longPressKeyCode(${keyCode}, ${metaState}, ${flags});`;
  }

  codeFor_hideKeyboard () {
    return `driver.hideKeyboard();`;
  }

  codeFor_isKeyboardShown () {
    return `var isKeyboardShown = driver.isKeyboardShown();`;
  }

  // Connectivity

  codeFor_toggleAirplaneMode () {
    return `driver.toggleAirplaneMode();`;
  }

  codeFor_toggleData () {
    return `driver.toggleData();`;
  }

  codeFor_toggleWiFi () {
    return `driver.toggleWifi();`;
  }

  codeFor_toggleLocationServices () {
    return `driver.toggleLocationServices();`;
  }

  codeFor_sendSMS (varNameIgnore, varIndexIgnore, phoneNumber, text) {
    return `driver.sendSMS("${phoneNumber}", "${text}");`;
  }

  codeFor_gsmCall (varNameIgnore, varIndexIgnore, phoneNumber, action) {
    return `driver.makeGsmCall("${phoneNumber}", "${action}");`;
  }

  codeFor_gsmSignal (varNameIgnore, varIndexIgnore, signalStrength) {
    return `driver.setGsmSignalStrength("${signalStrength}");`;
  }

  codeFor_gsmVoice (varNameIgnore, varIndexIgnore, state) {
    return `driver.setGsmVoice("${state}");`;
  }

  // Performance Data

  codeFor_getPerformanceData (varNameIgnore, varIndexIgnore, packageName, dataType, dataReadTimeout) {
    return `var performanceData = driver.getPerformanceData("${packageName}", "${dataType}", ${dataReadTimeout});`;
  }

  codeFor_getPerformanceDataTypes () {
    return `var performanceTypes = driver.getPerformanceDataTypes();`;
  }

  // System

  codeFor_openNotifications () {
    return `driver.openNotifications();`;
  }

  codeFor_getDeviceTime () {
    return `var time = driver.getDeviceTime();`;
  }

  // Session

  codeFor_getSession () {
    return `var caps = driver.getSessionDetails();`;
  }

  codeFor_setTimeouts (/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_getOrientation () {
    return `var orientation = driver.getOrientation();`;
  }

  codeFor_setOrientation (varNameIgnore, varIndexIgnore, orientation) {
    return `driver.rotate("${orientation}");`;
  }

  codeFor_getGeoLocation () {
    return `var location = driver.location();`;
  }

  codeFor_setGeoLocation (varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `driver.setLocation(new Location(${latitude}, ${longitude}, ${altitude}));`;
  }

  codeFor_getLogTypes () {
    return `var getLogTypes = driver.manage().logs().getAvailableLogTypes();`;
  }

  codeFor_getLogs (varNameIgnore, varIndexIgnore, logType) {
    return `var logEntries = driver.manage().logs().get("${logType}");`;
  }

  codeFor_updateSettings (varNameIgnore, varIndexIgnore, settingsJson) {
    try {
      let settings = '';
      for (let [settingName, settingValue] of _.toPairs(JSON.parse(settingsJson))) {
        settings += `driver.setSetting("${settingName}", "${settingValue}");\n`;
      }
      return settings;
    } catch (e) {
      return `// Could not parse: ${settingsJson}`;
    }
  }

  codeFor_getSettings () {
    return `var settings = driver.getSettings();`;
  }

  // Web

  codeFor_navigateTo (varNameIgnore, varIndexIgnore, url) {
    return `driver.get("${url}");`;
  }

  codeFor_getUrl () {
    return `var currentUrl = driver.getCurrentUrl();`;
  }

  codeFor_back () {
    return `driver.navigate().back();`;
  }

  codeFor_forward () {
    return `driver.navigate().forward();`;
  }

  codeFor_refresh () {
    return `driver.navigate().refresh();`;
  }

  // Context

  codeFor_getContext () {
    return `driver.getContext();`;
  }

  codeFor_getContexts () {
    return `driver.getContextHandles();`;
  }

  codeFor_switchContext (varNameIgnore, varIndexIgnore, name) {
    return `driver.context("${name}");`;
  }
}

JavaFramework.readableName = 'Java - JUnit';

export default JavaFramework;
