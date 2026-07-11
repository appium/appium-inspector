import {
  IconCarouselHorizontal,
  IconChevronLeft,
  IconCircle,
  IconHome,
  IconMessageChatbot,
  IconSquare,
} from '@tabler/icons-react';
import {Button, Divider, Select, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {DRIVERS} from '../../../constants/common.js';
import {openLink} from '../../../polyfills.js';
import ContextControlsGroup from './ElementGroups/ContextControlsGroup.jsx';
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

  const displayControls = (
    <Space.Compact>
      <Tooltip title={t('toggleMultiDisplayMode')}>
        <Button
          icon={<IconCarouselHorizontal size={18} />}
          type={displays ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          onClick={() => toggleMultiDisplayMode(displays)}
        />
      </Tooltip>
      {displays && (
        <Select
          styles={{root: {width: 250}}}
          value={currentDisplayId}
          popupMatchSelectWidth={false}
          onChange={(value) => value !== currentDisplayId && setCurrentDisplayId(value)}
          options={displays.map(({id, name}) => ({
            value: id,
            label: name ? `${name} (ID ${id})` : id,
          }))}
        />
      )}
    </Space.Compact>
  );

  return (
    <div className={styles.headerButtons}>
      <Space size="middle">
        {deviceControls}
        {automationName === DRIVERS.UIAUTOMATOR2 && displayControls}
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
