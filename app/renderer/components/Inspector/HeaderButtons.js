import React from 'react';
import { Button, Tooltip, Select, Space } from 'antd';
import InspectorStyles from './Inspector.css';
import { HiOutlineMicrophone, HiOutlineHome } from 'react-icons/hi';
import { BiSquare, BiCircle } from 'react-icons/bi';
import { IoChevronBackOutline } from 'react-icons/io5';
import { shell } from '../../polyfills';
import { APP_MODE } from './shared';
import { BUTTON } from '../AntdTypes';
import {
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  VideoCameraOutlined,
  SearchOutlined,
  CloseOutlined,
  AppstoreOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const HYBRID_MODE_DOCS_URL = 'https://appium.github.io/appium.io/docs/en/writing-running-appium/web/hybrid/';

const HeaderButtons = (props) => {
  const { selectAppMode, appMode, mjpegScreenshotUrl, isSourceRefreshOn, toggleRefreshingState,
          isRecording, startRecording, pauseRecording, showLocatorTestModal, showSiriCommandModal,
          applyClientMethod, quitCurrentSession, driver, contexts, currentContext, setContext, t } = props;

  const deviceControls = <Button.Group>
    {driver && driver.client.isIOS && <>
      <Tooltip title={t('Press Home Button')}>
        <Button id='btnPressHomeButton'
          icon={<HiOutlineHome className={InspectorStyles['custom-button-icon']}/>}
          onClick={() =>
            applyClientMethod({ methodName: 'executeScript', args: ['mobile:pressButton', [{name: 'home'}]]})
          } />
      </Tooltip>
      <Tooltip title={t('Execute Siri Command')}>
        <Button id='siriCommand'
          icon={<HiOutlineMicrophone className={InspectorStyles['custom-button-icon']}/>}
          onClick={showSiriCommandModal} />
      </Tooltip>
    </>}
    {driver && driver.client.isAndroid && <>
      <Tooltip title={t('Press Back Button')}>
        <Button id='btnPressHomeButton'
          icon={<IoChevronBackOutline className={InspectorStyles['custom-button-icon']}/>}
          onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [4]})} />
      </Tooltip>
      <Tooltip title={t('Press Home Button')}>
        <Button id='btnPressHomeButton'
          icon={<BiCircle className={InspectorStyles['custom-button-icon']}/>}
          onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [3]})} />
      </Tooltip>
      <Tooltip title={t('Press App Switch Button')}>
        <Button id='btnPressHomeButton'
          icon={<BiSquare className={InspectorStyles['custom-button-icon']}/>}
          onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [187]})} />
      </Tooltip>
    </>}
  </Button.Group>;

  const appModeControls = <Button.Group value={appMode}>
    <Tooltip title={t('Native App Mode')}>
      <Button icon={<AppstoreOutlined/>} onClick={() => {selectAppMode(APP_MODE.NATIVE);}}
        type={appMode === APP_MODE.NATIVE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
      />
    </Tooltip>
    <Tooltip title={t('Web/Hybrid App Mode')}>
      <Button icon={<GlobalOutlined/>} onClick={() => {selectAppMode(APP_MODE.WEB_HYBRID);}}
        type={appMode === APP_MODE.WEB_HYBRID ? BUTTON.PRIMARY : BUTTON.DEFAULT}
      />
    </Tooltip>
    {contexts && contexts.length === 1 &&
      <Tooltip title={t('noAdditionalContextsFound')} overlayClassName={InspectorStyles['wide-tooltip']}>
        <div className={`${InspectorStyles['contexts-custom-btn']} ${InspectorStyles['no-contexts-info-icon']}`}>
          <ExclamationCircleOutlined className={InspectorStyles['custom-button-icon']}/>
        </div>
      </Tooltip>
    }
    {contexts && contexts.length > 1 && <>
      <Select
        className={InspectorStyles['header-context-selector']}
        value={currentContext}
        dropdownMatchSelectWidth={false}
        onChange={(value) => {
          setContext(value);
          applyClientMethod({methodName: 'switchContext', args: [value]});
        }}>
        {contexts.map(({id, title}) =>
          <Select.Option key={id} value={id}>
            {title ? `${title} (${id})` : id}
          </Select.Option>
        )}
      </Select>
      <Tooltip
        title={<>
          {t('contextDropdownInfo')} <a onClick={(e) => e.preventDefault() || shell.openExternal(HYBRID_MODE_DOCS_URL)}>{HYBRID_MODE_DOCS_URL}</a>
        </>}
        overlayClassName={InspectorStyles['wide-tooltip']}>
        <div className={`${InspectorStyles['contexts-custom-btn']} ${InspectorStyles['contexts-info-icon']}`}>
          <InfoCircleOutlined className={InspectorStyles['custom-button-icon']}/>
        </div>
      </Tooltip>
    </>}
  </Button.Group>;

  const generalControls = <Button.Group>
    {mjpegScreenshotUrl && !isSourceRefreshOn &&
        <Tooltip title={t('Start Refreshing Source')}>
          <Button id='btnStartRefreshing' icon={<PlayCircleOutlined/>} onClick={toggleRefreshingState}/>
        </Tooltip>
    }
    {mjpegScreenshotUrl && isSourceRefreshOn &&
      <Tooltip title={t('Pause Refreshing Source')}>
        <Button id='btnPauseRefreshing' icon={<PauseCircleOutlined/>} onClick={toggleRefreshingState}/>
      </Tooltip>
    }
    <Tooltip title={t('refreshSource')}>
      <Button id='btnReload' icon={<ReloadOutlined/>} onClick={() => applyClientMethod({methodName: 'getPageSource'})}/>
    </Tooltip>
    <Tooltip title={t('Search for element')}>
      <Button id='searchForElement' icon={<SearchOutlined/>} onClick={showLocatorTestModal} />
    </Tooltip>
    {!isRecording &&
      <Tooltip title={t('Start Recording')}>
        <Button id='btnStartRecording' icon={<VideoCameraOutlined/>} onClick={startRecording}/>
      </Tooltip>
    }
    {isRecording &&
      <Tooltip title={t('Pause Recording')}>
        <Button id='btnPause' icon={<VideoCameraOutlined/>} type={BUTTON.DANGER} onClick={pauseRecording}/>
      </Tooltip>
    }
  </Button.Group>;

  const quitSessionButton = <Tooltip title={t('quitSessionAndClose')}>
    <Button id='btnClose' icon={<CloseOutlined/>} onClick={quitCurrentSession}/>
  </Tooltip>;

  return <div className={InspectorStyles['inspector-toolbar']}>
    <Space size='middle'>
      {deviceControls}
      {appModeControls}
      {generalControls}
      {quitSessionButton}
    </Space>
  </div>;
};

export default HeaderButtons;
