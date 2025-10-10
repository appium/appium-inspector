import {
  AppstoreOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {Button, Divider, Select, Space, Tooltip} from 'antd';
import {BiCircle, BiRecycle, BiSquare} from 'react-icons/bi';
import {HiOutlineHome, HiOutlineMicrophone} from 'react-icons/hi';
import {IoChevronBackOutline} from 'react-icons/io5';

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
    toggleRefreshingState,
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
    t,
    autoSessionRestart,
    toggleAutoSessionRestart,
  } = props;

  const deviceControls = (
    <Space.Compact>
      {driver && driver.isIOS && (
        <>
          <Tooltip title={t('Press Home Button')}>
            <Button
              id="btnPressHomeButton"
              icon={<HiOutlineHome className={styles.headerBtnIcon} />}
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
              icon={<HiOutlineMicrophone className={styles.headerBtnIcon} />}
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
              icon={<IoChevronBackOutline className={styles.headerBtnIcon} />}
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
              icon={<BiCircle className={styles.headerBtnIcon} />}
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
              icon={<BiSquare className={styles.headerBtnIcon} />}
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
          icon={<AppstoreOutlined />}
          onClick={() => selectAppMode(APP_MODE.NATIVE)}
          type={appMode === APP_MODE.NATIVE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      <Tooltip title={t('Web/Hybrid App Mode')}>
        <Button
          icon={<GlobalOutlined />}
          onClick={() => selectAppMode(APP_MODE.WEB_HYBRID)}
          type={appMode === APP_MODE.WEB_HYBRID ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      {contexts && contexts.length === 1 && (
        <Tooltip title={t('noAdditionalContextsFound')} classNames={{root: styles.wideTooltip}}>
          <div className={`${styles.contextsInfoBtn} ${styles.noContextsInfoIcon}`}>
            <ExclamationCircleOutlined className={styles.headerBtnIcon} />
          </div>
        </Tooltip>
      )}
      {contexts && contexts.length > 1 && (
        <>
          <Select
            className={styles.headerContextSelector}
            value={currentContext}
            popupMatchSelectWidth={false}
            onChange={(value) => {
              setContext(value);
              applyClientMethod({methodName: 'switchAppiumContext', args: [value]});
            }}
          >
            {contexts.map(({id, title}) => (
              <Select.Option key={id} value={id}>
                {title ? `${title} (${id})` : id}
              </Select.Option>
            ))}
          </Select>
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
            <div className={`${styles.contextsInfoBtn} ${styles.contextsInfoIcon}`}>
              <InfoCircleOutlined className={styles.headerBtnIcon} />
            </div>
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
            icon={<PlayCircleOutlined />}
            onClick={toggleRefreshingState}
          />
        </Tooltip>
      )}
      {isUsingMjpegMode && isSourceRefreshOn && (
        <Tooltip title={t('Pause Refreshing Source')}>
          <Button
            id="btnPauseRefreshing"
            icon={<PauseCircleOutlined />}
            onClick={toggleRefreshingState}
          />
        </Tooltip>
      )}
      <Tooltip title={t('refreshSource')}>
        <Button
          id="btnReload"
          icon={<ReloadOutlined />}
          onClick={() => applyClientMethod({methodName: 'getPageSource'})}
        />
      </Tooltip>
      <Tooltip title={t('Search for element')}>
        <Button id="searchForElement" icon={<SearchOutlined />} onClick={showLocatorTestModal} />
      </Tooltip>
      {!isRecording && (
        <Tooltip title={t('Start Recording')}>
          <Button id="btnStartRecording" icon={<VideoCameraOutlined />} onClick={startRecording} />
        </Tooltip>
      )}
      {isRecording && (
        <Tooltip title={t('Pause Recording')}>
          <Button
            id="btnPause"
            icon={<VideoCameraOutlined />}
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
      <Button id="btnClose" icon={<CloseOutlined />} onClick={quitCurrentSession} />
    </Tooltip>
  );

  const sessionReloadButton = (
    <Tooltip title={t('ToggleRestartSession')}>
      <Button
        id={autoSessionRestart ? 'btnDisableRestartSession' : 'btnEnableRestartSession'}
        icon={<BiRecycle />}
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
