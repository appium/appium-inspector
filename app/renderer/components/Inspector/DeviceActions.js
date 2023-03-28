import React, { Component } from 'react';
import { Button, Tooltip } from 'antd';
import InspectorStyles from './Inspector.css';
import { withTranslation } from '../../util';
import { HiOutlineMicrophone, HiOutlineHome } from 'react-icons/hi';
import { BiSquare, BiCircle } from 'react-icons/bi';
import { IoChevronBackOutline } from 'react-icons/io5';

class DeviceActions extends Component {

  render () {
    const {
      applyClientMethod,
      showSiriCommandModal,
      t,
      driver
    } = this.props;

    return <div>
      {driver.client.isIOS && <div className={InspectorStyles['action-controls']}>
        <Tooltip title={t('Press Home button')}>
          <Button id='btnPressHomeButton' icon={<HiOutlineHome className={InspectorStyles['custom-button-icon']}/>} onClick={() => applyClientMethod({ methodName: 'executeScript', args: ['mobile:pressButton', [{name: 'home'}]]})}/>
        </Tooltip>
        <Tooltip title={t('Siri command')}>
          <Button id='siriCommand' icon={<HiOutlineMicrophone className={InspectorStyles['custom-button-icon']}/>} onClick={showSiriCommandModal} />
        </Tooltip>
      </div>}
      {driver.client.isAndroid && <div className={InspectorStyles['action-controls']}>
        <Tooltip title={t('Press Back button')}>
          <Button id='btnPressHomeButton' icon={<IoChevronBackOutline className={InspectorStyles['custom-button-icon']}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [3]})}/>
        </Tooltip>
        <Tooltip title={t('Press Home button')}>
          <Button id='btnPressHomeButton' icon={<BiCircle className={InspectorStyles['custom-button-icon']}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [4]})}/>
        </Tooltip>
        <Tooltip title={t('Press Overview button')}>
          <Button id='btnPressHomeButton' icon={<BiSquare className={InspectorStyles['custom-button-icon']}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [187]})}/>
        </Tooltip>
      </div>}
    </div>;
  }
}

export default withTranslation(DeviceActions);