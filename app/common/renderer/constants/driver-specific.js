// Constants for driver-specific values

/**
 * Supported values for the XCUITest driver's 'mobile: pressButton' extension on iOS.
 * The Inspector only applies constraints for the device category and OS version:
 * limitations for Xcode, device model and simulator/real device currently cannot be implemented
 * @see https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-pressbutton
 */
export const XCUITEST_IOS_BUTTONS = {
  HOME: 'home',
  // Real devices only
  VOLUME_UP: 'volumeup',
  VOLUME_DOWN: 'volumedown',
  // iOS 16+ supported devices only
  ACTION: 'action',
  // iOS 16+ supported real devices only
  CAMERA: 'camera',
};

/**
 * Supported values for the XCUITest driver's 'mobile: pressButton' extension on tvOS.
 */
export const XCUITEST_TVOS_BUTTONS = {
  HOME: 'home',
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  MENU: 'menu',
  PLAY_PAUSE: 'playpause',
  SELECT: 'select',
  PAGE_UP: 'pageup',
  PAGE_DOWN: 'pagedown',
  GUIDE: 'guide',
  // tvOS 18.1+ only
  FOUR_COLORS: 'fourcolors',
  ONE_TWO_THREE: 'onetwothree',
  TV_PROVIDER: 'tvprovider',
};

/**
 * Supported values for the XCUITest driver's 'mobile: pressButton' extension on watchOS.
 */
export const XCUITEST_WATCHOS_BUTTONS = {
  HOME: 'home',
  // Supported devices only
  ACTION: 'action',
};

/**
 * Supported values for the XCUITest driver's 'mobile: performHandGesture' extension.
 * @see https://appium.github.io/appium-xcuitest-driver/latest/reference/execute-methods/#mobile-performhandgesture
 */
export const XCUITEST_WATCHOS_GESTURES = {
  DOUBLE_TAP: 'doubleTap',
  // watchOS 26+ only
  FLICK: 'flick',
};

/**
 * Minimum iOS version that supports the action and camera buttons
 */
export const XCUITEST_IOS_MIN_EXTRA_BUTTONS_VERSION = 16;

/**
 * Minimum tvOS version that supports the fourcolors, onetwothree and tvprovider buttons
 */
export const XCUITEST_TVOS_MIN_EXTRA_BUTTONS_VERSION = 18.1;

/**
 * Minimum watchOS version that supports the flick gesture
 */
export const XCUITEST_WATCHOS_MIN_EXTRA_GESTURES_VERSION = 26;
