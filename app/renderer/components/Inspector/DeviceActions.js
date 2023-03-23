import React, { Component } from 'react';
import { Button, Tooltip } from 'antd';
import InspectorStyles from './Inspector.css';
import { withTranslation, isIOS, isAndroid } from '../../util';
import { HiOutlineMicrophone, HiOutlineHome } from 'react-icons/hi';
import { BiSquare, BiCircle } from 'react-icons/bi';
import { IoChevronBackOutline } from 'react-icons/io5';

let isIOSDevice;
let isAndroidDevice;

class DeviceActions extends Component {
  
  async componentDidMount () {
    const { driver, applyClientMethod } = this.props;
    if (driver._isAttachedSession) {
      let sessionDetails = await this.getSessionDetails(applyClientMethod);
      isIOSDevice = isIOS(sessionDetails);
      isAndroidDevice = isAndroid(sessionDetails);
    } else {
      isIOSDevice = driver.client.isIOS;
      isAndroidDevice = driver.client.isAndroid;
    }
  }

  async getSessionDetails (applyClientMethod) {
    return await applyClientMethod({methodName: 'getSession'});
  }

  render () {
    const {
        applyClientMethod,
        showSiriCommandModal,
        t,
    } = this.props;

    return <div>
        {isIOSDevice && <div className={InspectorStyles['action-controls']}>
        <Tooltip title={t('Press Home button')}>
            <Button id='btnPressHomeButton' icon={<HiOutlineHome style={{ fontSize: '16px', verticalAlign: 'middle' }}/>} onClick={() => applyClientMethod({ methodName: 'executeScript', args: ['mobile:pressButton', [{name: 'home'}]]})}/>
        </Tooltip>
        <Tooltip title={t('Siri command')}>
            <Button id='siriCommand' icon={<HiOutlineMicrophone style={{ fontSize: '16px', verticalAlign: 'middle' }}/>} onClick={showSiriCommandModal} />
        </Tooltip>
        </div>}
        {isAndroidDevice && <div className={InspectorStyles['action-controls']}>
        <Tooltip title={t('Press Back button')}>
            <Button id='btnPressHomeButton' icon={<IoChevronBackOutline style={{ fontSize: '16px', verticalAlign: 'middle' }}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [3]})}/>
        </Tooltip>
        <Tooltip title={t('Press Home button')}>
            <Button id='btnPressHomeButton' icon={<BiCircle style={{ fontSize: '16px', verticalAlign: 'middle' }}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [4]})}/>
        </Tooltip>
        <Tooltip title={t('Press Overview button')}>
            <Button id='btnPressHomeButton' icon={<BiSquare style={{ fontSize: '16px', verticalAlign: 'middle' }}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [187]})}/>
        </Tooltip>
        </div>}
    </div>;
  }
}

export default withTranslation(DeviceActions);