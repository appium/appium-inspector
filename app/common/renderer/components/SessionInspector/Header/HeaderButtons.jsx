import {Divider, Space} from 'antd';

import {openLink} from '../../../polyfills.js';
import ContextControlsGroup from './ContextControlsGroup.jsx';
import DeviceControlsGroup from './DeviceControlsGroup.jsx';
import DisplayControlsGroup from './DisplayControlsGroup.jsx';
import GeneralControlsGroup from './GeneralControlsGroup.jsx';
import styles from './Header.module.css';
import SessionQuitControlsGroup from './SessionQuitControlsGroup.jsx';
import SessionReloadButton from './SessionReloadButton.jsx';

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
    driver,
    contexts,
    currentContext,
    setContext,
    autoSessionRestart,
    toggleAutoSessionRestart,
    toggleMultiDisplayMode,
    displays,
    setCurrentDisplayId,
    currentDisplayId,
    automationName,
    siriCommandValue,
    setSiriCommandValue,
    isSiriCommandModalVisible,
    hideSiriCommandModal,
  } = props;

  return (
    <div className={styles.headerButtons}>
      <Space size="middle">
        <DeviceControlsGroup
          driver={driver}
          applyClientMethod={applyClientMethod}
          showSiriCommandModal={showSiriCommandModal}
          siriCommandValue={siriCommandValue}
          setSiriCommandValue={setSiriCommandValue}
          isSiriCommandModalVisible={isSiriCommandModalVisible}
          hideSiriCommandModal={hideSiriCommandModal}
        />
        <DisplayControlsGroup
          automationName={automationName}
          displays={displays}
          currentDisplayId={currentDisplayId}
          setCurrentDisplayId={setCurrentDisplayId}
          toggleMultiDisplayMode={toggleMultiDisplayMode}
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
