import {Space} from 'antd';

import UiA2DisplayControls from './UiA2DisplayControls.jsx';
import UiA2WindowControls from './UiA2WindowControls.jsx';

const DISPLAY_CONTROLS_MIN_ANDROID_VER = 11;

/**
 * Controls specific to the UiAutomator2 driver
 */
const UiAutomator2Controls = ({featureCaps, sessionSettings, applyClientMethod}) => (
  <Space.Compact>
    {featureCaps.platformVersion >= DISPLAY_CONTROLS_MIN_ANDROID_VER && (
      <UiA2DisplayControls sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
    )}
    <UiA2WindowControls sessionSettings={sessionSettings} applyClientMethod={applyClientMethod} />
  </Space.Compact>
);

export default UiAutomator2Controls;
