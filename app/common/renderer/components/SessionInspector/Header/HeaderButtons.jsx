import {Divider, Space} from 'antd';

import {PLATFORMS} from '../../../constants/common.js';
import {NATIVE_APP} from '../../../constants/session-inspector.js';
import {openLink} from '../../../polyfills.js';
import ContextControlsGroup from './ContextControlsGroup.jsx';
import DeviceControlsGroup from './DeviceControls/DeviceControlsGroup.jsx';
import DriverControlsGroup from './DriverControls/DriverControlsGroup.jsx';
import GeneralControlsGroup from './GeneralControlsGroup.jsx';
import SessionQuitControlsGroup from './SessionQuitControlsGroup.jsx';
import SessionReloadButton from './SessionReloadButton.jsx';
import WebDriverWindowSwitcher from './WebDriverWindowSwitcher.jsx';

import styles from './Header.module.css';

/**
 * Parent container for control buttons located in the application header.
 */
const HeaderButtons = (props) => {
  const {
    selectAppMode,
    appMode,
    applyClientMethod,
    executeDriverCommand,
    quitSessionAndReturn,
    contexts,
    currentContext,
    setContext,
    autoSessionRestart,
    toggleAutoSessionRestart,
    featureCaps,
    sessionSettings,
    driver,
    methodCallInProgress,
  } = props;
  const showWindowSwitcher =
    featureCaps.browserName ||
    featureCaps.platformName === PLATFORMS.WINDOWS ||
    (currentContext && currentContext !== NATIVE_APP);

  return (
    <div className={styles.headerButtons}>
      <Space size={['middle', 'small']} wrap className={styles.headerButtonsSpace}>
        <DeviceControlsGroup
          featureCaps={featureCaps}
          applyClientMethod={applyClientMethod}
          executeDriverCommand={executeDriverCommand}
        />
        <DriverControlsGroup
          featureCaps={featureCaps}
          sessionSettings={sessionSettings}
          applyClientMethod={applyClientMethod}
        />
        <ContextControlsGroup
          selectAppMode={selectAppMode}
          appMode={appMode}
          contexts={contexts}
          currentContext={currentContext}
          setContext={setContext}
          applyClientMethod={applyClientMethod}
          openLink={openLink}
        />
        {showWindowSwitcher && (
          <WebDriverWindowSwitcher
            key={`${driver?.sessionId}:${currentContext}`}
            applyClientMethod={applyClientMethod}
            executeDriverCommand={executeDriverCommand}
            disabled={methodCallInProgress}
          />
        )}
        <GeneralControlsGroup {...props} />
        <SessionReloadButton
          autoSessionRestart={autoSessionRestart}
          toggleAutoSessionRestart={toggleAutoSessionRestart}
        />
        <SessionQuitControlsGroup quitSessionAndReturn={quitSessionAndReturn} />
      </Space>
      <Divider />
    </div>
  );
};

export default HeaderButtons;
