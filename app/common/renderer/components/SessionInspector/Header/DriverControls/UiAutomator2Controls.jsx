import UiA2DisplayControls from './UiA2DisplayControls.jsx';

const UIA2_DISPLAY_CONTROLS_MIN_ANDROID_VER = 11;

/**
 * Controls specific to the UiAutomator2 driver
 */
const UiAutomator2Controls = ({featureCaps, sessionSettings, applyClientMethod}) =>
  featureCaps.platformVersion >= UIA2_DISPLAY_CONTROLS_MIN_ANDROID_VER && (
    <UiA2DisplayControls sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
  );

export default UiAutomator2Controls;
