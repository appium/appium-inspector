import {
  IconChevronLeft,
  IconCircle,
  IconExclamationCircle,
  IconHome,
  IconInfoCircle,
  IconMessageChatbot,
  IconPlayerPause,
  IconPlayerPlay,
  IconRecycle,
  IconRefresh,
  IconSearch,
  IconSquare,
  IconTriangleSquareCircle,
  IconVideo,
  IconWorld,
  IconX,
} from '@tabler/icons-react';
import {Button, Divider, Select, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {LINKS} from '../../../constants/common.js';
import {APP_MODE} from '../../../constants/session-inspector.js';
import {openLink} from '../../../polyfills.js';
import styles from './Header.module.css';

const HeaderButtons = (props) => {
  const {
    selectAppMode,
    appMode,
    isUsingMjpegMode,
    isSourceRefreshOn,
    setRefreshingState,
    isRecording,
    startRecording,
    pauseRecording,
    showLocatorTestModal,
    showSiriCommandModal,
    applyClientMethod,
    quitCurrentSession,
    driver,
    contexts,
    currentContext,
    setContext,
    autoSessionRestart,
    toggleAutoSessionRestart,
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

  const appModeControls = (
    <Space.Compact>
      <Tooltip title={t('Native App Mode')}>
        <Button
          icon={<IconTriangleSquareCircle size={18} />}
          onClick={() => selectAppMode(APP_MODE.NATIVE)}
          type={appMode === APP_MODE.NATIVE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      <Tooltip title={t('Web/Hybrid App Mode')}>
        <Button
          icon={<IconWorld size={18} />}
          onClick={() => selectAppMode(APP_MODE.WEB_HYBRID)}
          type={appMode === APP_MODE.WEB_HYBRID ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      {contexts && contexts.length === 1 && (
        <Tooltip title={t('noAdditionalContextsFound')} classNames={{root: styles.wideTooltip}}>
          <Button
            disabled
            icon={<IconExclamationCircle size={20} />}
            styles={{root: {backgroundColor: '#faad14', color: '#ffffff'}}}
          />
        </Tooltip>
      )}
      {contexts && contexts.length > 1 && (
        <>
          <Select
            styles={{root: {width: 350}}}
            value={currentContext}
            popupMatchSelectWidth={false}
            onChange={(value) => {
              setContext(value);
              applyClientMethod({methodName: 'switchAppiumContext', args: [value]});
            }}
            options={contexts.map(({id, title}) => ({
              value: id,
              label: title ? `${title} (${id})` : id,
            }))}
          />
          <Tooltip
            title={
              <>
                {t('contextDropdownInfo')}{' '}
                <a onClick={(e) => e.preventDefault() || openLink(LINKS.HYBRID_MODE_DOCS)}>
                  {LINKS.HYBRID_MODE_DOCS}
                </a>
              </>
            }
            classNames={{root: styles.wideTooltip}}
          >
            <Button
              disabled
              icon={<IconInfoCircle size={20} />}
              styles={{root: {backgroundColor: 'var(--ant-color-primary)', color: '#ffffff'}}}
            />
          </Tooltip>
        </>
      )}
    </Space.Compact>
  );

  const generalControls = (
    <Space.Compact>
      {isUsingMjpegMode && !isSourceRefreshOn && (
        <Tooltip title={t('Start Refreshing Source')}>
          <Button
            id="btnStartRefreshing"
            icon={<IconPlayerPlay size={18} />}
            onClick={() => setRefreshingState({source: true})}
          />
        </Tooltip>
      )}
      {isUsingMjpegMode && isSourceRefreshOn && (
        <Tooltip title={t('Pause Refreshing Source')}>
          <Button
            id="btnPauseRefreshing"
            icon={<IconPlayerPause size={18} />}
            onClick={() => setRefreshingState({source: false})}
          />
        </Tooltip>
      )}
      <Tooltip title={t('refreshSource')}>
        <Button
          id="btnReload"
          icon={<IconRefresh size={18} />}
          onClick={() => applyClientMethod({methodName: 'getPageSource'})}
        />
      </Tooltip>
      <Tooltip title={t('Search for element')}>
        <Button
          id="searchForElement"
          icon={<IconSearch size={18} />}
          onClick={showLocatorTestModal}
        />
      </Tooltip>
      {!isRecording && (
        <Tooltip title={t('Start Recording')}>
          <Button id="btnStartRecording" icon={<IconVideo size={18} />} onClick={startRecording} />
        </Tooltip>
      )}
      {isRecording && (
        <Tooltip title={t('Pause Recording')}>
          <Button
            id="btnPause"
            icon={<IconVideo size={18} />}
            type={BUTTON.PRIMARY}
            danger
            onClick={pauseRecording}
          />
        </Tooltip>
      )}
    </Space.Compact>
  );

  const quitSessionButton = (
    <Tooltip title={t('Quit Session')}>
      <Button id="btnClose" icon={<IconX size={18} />} onClick={quitCurrentSession} />
    </Tooltip>
  );

  const sessionReloadButton = (
    <Tooltip title={t('ToggleRestartSession')}>
      <Button
        id={autoSessionRestart ? 'btnDisableRestartSession' : 'btnEnableRestartSession'}
        icon={<IconRecycle size={16} />}
        type={autoSessionRestart ? BUTTON.PRIMARY : undefined}
        onClick={toggleAutoSessionRestart}
      />
    </Tooltip>
  );

  return (
    <div className={styles.headerButtons}>
      <Space size="middle">
        {deviceControls}
        {appModeControls}
        {generalControls}
        {sessionReloadButton}
        {quitSessionButton}
      </Space>
      <Divider />
    </div>
  );
};

export default HeaderButtons;
