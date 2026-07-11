import {Divider, Space} from 'antd';

import {openLink} from '../../../polyfills.js';
import ContextControlsGroup from './ElementGroups/ContextControlsGroup.jsx';
import DeviceControlsGroup from './ElementGroups/DeviceControlsGroup.jsx';
import DisplayControlsGroup from './ElementGroups/DisplayControlsGroup.jsx';
import GeneralControlsGroup from './ElementGroups/GeneralControlsGroup.jsx';
import SessionQuitControlsGroup from './ElementGroups/SessionQuitControlsGroup.jsx';
import SessionReloadButton from './ElementGroups/SessionReloadButton.jsx';
import styles from './Header.module.css';
import LocatorSearchModal from './LocatorSearch/LocatorSearchModal.jsx';
import SiriCommandModal from './SiriCommandModal.jsx';

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
      <LocatorSearchModal {...props} />
      <SiriCommandModal
        siriCommandValue={siriCommandValue}
        setSiriCommandValue={setSiriCommandValue}
        isSiriCommandModalVisible={isSiriCommandModalVisible}
        applyClientMethod={applyClientMethod}
        hideSiriCommandModal={hideSiriCommandModal}
      />
    </div>
  );
};

export default HeaderButtons;
