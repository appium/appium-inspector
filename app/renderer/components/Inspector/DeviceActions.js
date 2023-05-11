import React, { Component } from 'react';
import { Button, Tooltip } from 'antd';
import InspectorStyles from './Inspector.css';
import { withTranslation } from '../../util';
import { HiOutlineMicrophone, HiOutlineHome } from 'react-icons/hi';
import { BiSquare, BiCircle } from 'react-icons/bi';
import { IoChevronBackOutline } from 'react-icons/io5';

const ButtonGroup = Button.Group;

class DeviceActions extends Component {

  render () {
    const {
      applyClientMethod,
      showSiriCommandModal,
      t,
      driver
    } = this.props;

    return <ButtonGroup>
      {driver.client.isIOS && <div className={InspectorStyles['action-controls']}>
        <Tooltip title={t('Press Home Button')}>
          <Button id='btnPressHomeButton' icon={<HiOutlineHome className={InspectorStyles['custom-button-icon']}/>} onClick={() => applyClientMethod({ methodName: 'executeScript', args: ['mobile:pressButton', [{name: 'home'}]]})}/>
        </Tooltip>
        <Tooltip title={t('Execute Siri Command')}>
          <Button id='siriCommand' icon={<HiOutlineMicrophone className={InspectorStyles['custom-button-icon']}/>} onClick={showSiriCommandModal} />
        </Tooltip>
      </div>}
      {driver.client.isAndroid && <div className={InspectorStyles['action-controls']}>
        <Tooltip title={t('Press Back Button')}>
          <Button id='btnPressHomeButton' icon={<IoChevronBackOutline className={InspectorStyles['custom-button-icon']}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [4]})}/>
        </Tooltip>
        <Tooltip title={t('Press Home Button')}>
          <Button id='btnPressHomeButton' icon={<BiCircle className={InspectorStyles['custom-button-icon']}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [3]})}/>
        </Tooltip>
        <Tooltip title={t('Press App Switch Button')}>
          <Button id='btnPressHomeButton' icon={<BiSquare className={InspectorStyles['custom-button-icon']}/>} onClick={() => applyClientMethod({ methodName: 'pressKeyCode', args: [187]})}/>
        </Tooltip>
      </div>}
    </ButtonGroup>;
  }
}

export default withTranslation(DeviceActions);