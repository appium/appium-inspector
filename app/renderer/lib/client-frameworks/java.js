import Framework from './framework';
import _ from 'lodash';

class JavaFramework extends Framework {

  get language () {
    return 'java';
  }

  wrapWithBoilerplate (code) {
    let host = JSON.stringify(this.host);
    let port = JSON.stringify(this.port);
    let [pkg, cls] = (() => {
      if (this.caps.platformName) {
        switch (this.caps.platformName.toLowerCase()) {
          case 'ios': return ['ios', 'IOSDriver'];
          case 'android': return ['android', 'AndroidDriver'];
          default: return ['unknownPlatform', 'UnknownDriver'];
        }
      } else {
        return ['unknownPlatform', 'UnknownDriver'];
      }
    })();
    let capStr = this.indent(Object.keys(this.caps).map((k) => `desiredCapabilities.setCapability(${JSON.stringify(k)}, ${JSON.stringify(this.caps[k])});`).join('\n'), 4);
    // Import evry thing from selenium, to use WebElement, Point and other needed classes.
    return `
import io.appium.java_client.${pkg}.${cls};
import junit.framework.TestCase;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import java.net.MalformedURLException;
import java.net.URL;
import org.openqa.selenium.*;

public class SampleTest {

  private ${cls} driver;
  private PORT = ${port};
  private HOST = ${host};


  @Before
  public void setUp() throws MalformedURLException {
    DesiredCapabilities desiredCapabilities = new DesiredCapabilities();
${capStr}



    private URL getUrl(String host, String port) {
        try {
            return new URL(host+":"+port);
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        return null;
    }

    driver = new ${cls}(this.remoteUrl(HOST, PORT), desiredCapabilities);
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
      xpath: 'XPath',
      'accessibility id': 'AccessibilityId',
      'id': 'Id',
      'class name': 'ClassName',
      'name': 'Name',
      '-android uiautomator': 'AndroidUIAutomator',
      '-android datamatcher': 'AndroidDataMatcher',
      '-android viewtag': 'AndroidViewTag',
      '-ios predicate string': 'IosNsPredicate',
      '-ios class chain': 'IosClassChain',
    };
    if (!suffixMap[strategy]) {
      throw new Error(`Strategy ${strategy} can't be code-gened`);
    }
    // Chance IOSElement and AndroidElement to.
    if (isArray) {
      return `List<WebElement> ${localVar} = (WebElement) driver.findElementsBy${suffixMap[strategy]}(${JSON.stringify(locator)});`;
    } else {
      return `WebElement ${localVar} = (WebElement) driver.findElementBy${suffixMap[strategy]}(${JSON.stringify(locator)});`;
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

  // Change TouchAction to Sequence.
  codeFor_tap (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x, y} = this.getTapCoordinatesFromPointerActions(pointerActions);

    return `
    final PointerInput FINGER = new PointerInput(PointerInput.Kind.TOUCH, "FINGER");
    Point tapPoint = new Point(${x}, ${y});
    Sequence tap = new Sequence(FINGER, 1);
        tap.addAction(FINGER.createPointerMove(Duration.ofMillis(0),
                PointerInput.Origin.viewport(), tapPoint.x, tapPoint.y));
        tap.addAction(FINGER.createPointerDown(PointerInput.MouseButton.LEFT.asArg()));
        tap.addAction(FINGER.createPointerMove(Duration.ofMillis(50),
                PointerInput.Origin.viewport(), tapPoint.x, tapPoint.y));
        tap.addAction(FINGER.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
        driver.perform(Arrays.asList(tap));
    `;
  }

  // Change TouchAction to Sequence.
  codeFor_swipe (varNameIgnore, varIndexIgnore, pointerActions) {
    const {x1, y1, x2, y2} = this.getSwipeCoordinatesFromPointerActions(pointerActions);

    return `
    final PointerInput FINGER = new PointerInput(PointerInput.Kind.TOUCH, "finger");
    Point start = new Point(${x1}, ${y1});
    Point end = new Point (${x2}, ${y2});
    Sequence swipe = new Sequence(FINGER, 1)
                .addAction(
                        FINGER.createPointerMove(
                                Duration.ofMillis(0),
                                PointerInput.Origin.viewport(),
                                start.getX(),
                                start.getY()))
                .addAction(FINGER.createPointerDown(PointerInput.MouseButton.LEFT.asArg()))
                .addAction(
                        FINGER.createPointerMove(
                                Duration.ofMillis(1000),
                                PointerInput.Origin.viewport(),
                                end.getX(),
                                end.getY()))
                .addAction(FINGER.createPointerUp(PointerInput.MouseButton.LEFT.asArg()));
        driver.perform(Arrays.asList(swipe));
  `;
  }

  // Execute Script

  codeFor_executeScript (varNameIgnore, varIndexIgnore, scriptCmd, jsonArg) {
    let assembledCommand;
    if (jsonArg === undefined) {
      assembledCommand = `driver.executeScript("${scriptCmd}");`;
    } else {
      // change the JSON object into a format accepted by Map.ofEntries:
      // combine the keys and values into a flattened array, then stringify it
      const argsValuesArray = [].concat(...(_.toPairs(JSON.parse(jsonArg))));
      const argsValuesString = JSON.stringify(argsValuesArray).slice(1, -1);
      assembledCommand = `driver.executeScript("${scriptCmd}", ImmutableMap.ofEntries(${argsValuesString}));`;
    }
    return assembledCommand;
  }

  // App Management

  codeFor_startActivity (varNameIgnore, varIndexIgnore, ...args) {
    const argNames = ['appPackage', 'appActivity', 'appWaitPackage', 'intentAction', 'intentCategory',
      'intentFlags', 'optionalIntentArguments', 'dontStopAppOnReset'];
    // zip argument names and values into tuples, but only if the value was provided
    // then flatten the array of tuples and stringify it
    const argsValuesArray = argNames.flatMap((k, i) => (args[i] === undefined) ? [] : [k, args[i]]);
    const argsValuesString = JSON.stringify(argsValuesArray).slice(1, -1);
    return `driver.executeScript("mobile: startActivity", ImmutableMap.ofEntries(${argsValuesString}));`;
  }

  codeFor_getCurrentActivity () {
    return `String activityName = driver.currentActivity();`;
  }

  codeFor_getCurrentPackage () {
    return `String packageName = driver.currentPackage();`;
  }

  codeFor_installApp (varNameIgnore, varIndexIgnore, app) {
    return `driver.installApp("${app}");`;
  }

  codeFor_isAppInstalled (varNameIgnore, varIndexIgnore, app) {
    return `boolean isAppInstalled = driver.isAppInstalled("${app}");`;
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
    return `Map<String, String> appStrings = driver.getAppStringMap(${language ? `${language}, ` : ''}${stringFile ? `"${stringFile}` : ''});`;
  }

  // Clipboard

  codeFor_getClipboard () {
    return `String clipboardText = driver.getClipboardText();`;
  }

  codeFor_setClipboard (varNameIgnore, varIndexIgnore, clipboardText) {
    return `driver.setClipboardText("${clipboardText}");`;
  }

  // File Transfer


  codeFor_pushFile (varNameIgnore, varIndexIgnore, pathToInstallTo, fileContentString) {
    return `driver.pushFile("${pathToInstallTo}", ${fileContentString});`;
  }

  codeFor_pullFile (varNameIgnore, varIndexIgnore, pathToPullFrom) {
    return `byte[] fileBase64 = driver.pullFile("${pathToPullFrom}");`;
  }

  codeFor_pullFolder (varNameIgnore, varIndexIgnore, folderToPullFrom) {
    return `byte[] fileBase64 = driver.pullFolder("${folderToPullFrom}");`;
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
    return `boolean isLocked = driver.isDeviceLocked();`;
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
    return `boolean isKeyboardShown = driver.isKeyboardShown();`;
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
    return `List<List<Object>> performanceData = driver.getPerformanceData("${packageName}", "${dataType}", ${dataReadTimeout});`;
  }

  codeFor_getPerformanceDataTypes () {
    return `List<String> performanceTypes = driver.getPerformanceDataTypes();`;
  }

  // System

  codeFor_openNotifications () {
    return `driver.openNotifications();`;
  }

  codeFor_getDeviceTime () {
    return `String time = driver.getDeviceTime();`;
  }

  // Session

  codeFor_getSession () {
    return `Map<String, Object> caps = driver.getSessionDetails();`;
  }

  codeFor_setTimeouts (/*varNameIgnore, varIndexIgnore, timeoutsJson*/) {
    return '/* TODO implement setTimeouts */';
  }

  codeFor_getOrientation () {
    return `ScreenOrientation orientation = driver.getOrientation();`;
  }

  codeFor_setOrientation (varNameIgnore, varIndexIgnore, orientation) {
    return `driver.rotate("${orientation}");`;
  }

  codeFor_getGeoLocation () {
    return `Location location = driver.location();`;
  }

  codeFor_setGeoLocation (varNameIgnore, varIndexIgnore, latitude, longitude, altitude) {
    return `driver.setLocation(new Location(${latitude}, ${longitude}, ${altitude}));`;
  }

  codeFor_getLogTypes () {
    return `Set<String> getLogTypes = driver.manage().logs().getAvailableLogTypes();`;
  }

  codeFor_getLogs (varNameIgnore, varIndexIgnore, logType) {
    return `LogEntries logEntries = driver.manage().logs().get("${logType}");`;
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
    return `Map<String, Object> settings = driver.getSettings();`;
  }

  // Web

  codeFor_navigateTo (varNameIgnore, varIndexIgnore, url) {
    return `driver.get("${url}");`;
  }

  codeFor_getUrl () {
    return `String current_url = driver.getCurrentUrl();`;
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
