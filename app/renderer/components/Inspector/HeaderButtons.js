import React from 'react';
import { Button, Tooltip, Space } from 'antd';
import InspectorStyles from './Inspector.css';
import { HiOutlineMicrophone, HiOutlineHome } from 'react-icons/hi';
import { BiSquare, BiCircle } from 'react-icons/bi';
import { IoChevronBackOutline } from 'react-icons/io5';
import { APP_MODE } from './shared';
import { BUTTON } from '../AntdTypes';
import {
  ReloadOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  PauseOutlined,
  SearchOutlined,
  CloseOutlined,
  AppstoreOutlined,
  GlobalOutlined
} from '@ant-design/icons';

const HeaderButtons = (props) => {
  const { selectAppMode, appMode, mjpegScreenshotUrl, isSourceRefreshOn, toggleRefreshingState,
          isRecording, startRecording, pauseRecording, showLocatorTestModal, showSiriCommandModal,
          applyClientMethod, quitCurrentSession, driver, t } = props;

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
        <Button id='btnStartRecording' icon={<EyeOutlined/>} onClick={startRecording}/>
      </Tooltip>
    }
    {isRecording &&
      <Tooltip title={t('Pause Recording')}>
        <Button id='btnPause' icon={<PauseOutlined/>} type={BUTTON.DANGER} onClick={pauseRecording}/>
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
