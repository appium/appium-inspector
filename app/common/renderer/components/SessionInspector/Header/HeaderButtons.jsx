import {Divider, Space} from 'antd';

import {openLink} from '../../../polyfills.js';
import ContextControlsGroup from './ContextControlsGroup.jsx';
import DeviceControlsGroup from './DeviceControls/DeviceControlsGroup.jsx';
import DriverControlsGroup from './DriverControls/DriverControlsGroup.jsx';
import GeneralControlsGroup from './GeneralControlsGroup.jsx';
import SessionQuitControlsGroup from './SessionQuitControlsGroup.jsx';
import SessionReloadButton from './SessionReloadButton.jsx';

import styles from './Header.module.css';

/**
 * Parent container for control buttons located in the application header.
 */
const HeaderButtons = (props) => {
  const {
    selectAppMode,
    appMode,
    showSiriCommandModal,
    applyClientMethod,
    quitSessionAndReturn,
    contexts,
    currentContext,
    setContext,
    autoSessionRestart,
    toggleAutoSessionRestart,
    featureCaps,
    sessionSettings,
    siriCommandValue,
    setSiriCommandValue,
    isSiriCommandModalVisible,
    hideSiriCommandModal,
  } = props;

  return (
    <div className={styles.headerButtons}>
      <Space size="middle" wrap className={styles.headerButtonsSpace}>
        <DeviceControlsGroup
          featureCaps={featureCaps}
          applyClientMethod={applyClientMethod}
          showSiriCommandModal={showSiriCommandModal}
          siriCommandValue={siriCommandValue}
          setSiriCommandValue={setSiriCommandValue}
          isSiriCommandModalVisible={isSiriCommandModalVisible}
          hideSiriCommandModal={hideSiriCommandModal}
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
