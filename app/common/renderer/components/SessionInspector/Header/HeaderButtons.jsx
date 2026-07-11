import {
  IconChevronLeft,
  IconCircle,
  IconHome,
  IconMessageChatbot,
  IconSquare,
} from '@tabler/icons-react';
import {Button, Divider, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {openLink} from '../../../polyfills.js';
import ContextControlsGroup from './ElementGroups/ContextControlsGroup.jsx';
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
  const {t} = useTranslation();

  const deviceControls = (
    <Space.Compact>
      {driver && driver.isIOS && (
        <>
          <Tooltip title={t('Press Home Button')}>
            <Button
              id="btnPressHomeButton"
              icon={<IconHome size={18} />}
              onClick={() =>
                applyClientMethod({
                  methodName: 'executeScript',
                  args: ['mobile:pressButton', [{name: 'home'}]],
                })
              }
            />
          </Tooltip>
          <Tooltip title={t('Execute Siri Command')}>
            <Button
              id="siriCommand"
              icon={<IconMessageChatbot size={18} />}
              onClick={showSiriCommandModal}
            />
          </Tooltip>
        </>
      )}
      {driver && driver.isAndroid && (
        <>
          <Tooltip title={t('Press Back Button')}>
            <Button
              id="btnPressHomeButton"
              icon={<IconChevronLeft size={20} />}
              onClick={() =>
                applyClientMethod({
                  methodName: 'executeScript',
                  args: ['mobile:pressKey', [{keycode: 4}]],
                })
              }
            />
          </Tooltip>
          <Tooltip title={t('Press Home Button')}>
            <Button
              id="btnPressHomeButton"
              icon={<IconCircle size={16} />}
              onClick={() =>
                applyClientMethod({
                  methodName: 'executeScript',
                  args: ['mobile:pressKey', [{keycode: 3}]],
                })
              }
            />
          </Tooltip>
          <Tooltip title={t('Press App Switch Button')}>
            <Button
              id="btnPressHomeButton"
              icon={<IconSquare size={16} />}
              onClick={() =>
                applyClientMethod({
                  methodName: 'executeScript',
                  args: ['mobile:pressKey', [{keycode: 187}]],
                })
              }
            />
          </Tooltip>
        </>
      )}
    </Space.Compact>
  );

  return (
    <div className={styles.headerButtons}>
      <Space size="middle">
        {deviceControls}
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
