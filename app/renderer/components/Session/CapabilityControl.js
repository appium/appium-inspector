import React, { Component } from 'react';
import { Switch, Input } from 'antd';
import SessionStyles from './Session.css';
import { remote, log } from '../../polyfills';
import { FileOutlined } from '@ant-design/icons';
import { INPUT } from '../../../../gui-common/components/AntdTypes';
import _ from 'lodash';
import { APPIUM_SESSION_EXTENSION } from '../../helpers';

const {dialog} = remote;

export default class CapabilityControl extends Component {

  async getLocalFilePath () {
    try {
      const {canceled, filePaths} = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {name: 'Appium Session Files', extensions: [APPIUM_SESSION_EXTENSION]}
        ]
      });
      if (!canceled && !_.isEmpty(filePaths)) {
        return filePaths[0];
      }
    } catch (e) {
      log.error(e);
    }
  }

  render () {
    const {cap, onSetCapabilityParam, isEditingDesiredCaps, id, t, onPressEnter} = this.props;

    const buttonAfter = (currentFilePath) => <FileOutlined
      className={SessionStyles['filepath-button']}
      onClick={async () => {onSetCapabilityParam(await this.getLocalFilePath() || currentFilePath);}} />;

    switch (cap.type) {
      case 'text': return <Input disabled={isEditingDesiredCaps} id={id} placeholder={t('Value')} value={cap.value} onChange={(e) => onSetCapabilityParam(e.target.value)} onPressEnter={onPressEnter}/>;
      case 'boolean': return <Switch disabled={isEditingDesiredCaps} id={id} checkedChildren={'true'} unCheckedChildren={'false'}
        placeholder={t('Value')} checked={cap.value} onChange={(value) => onSetCapabilityParam(value)} />;
      case 'number': return <Input disabled={isEditingDesiredCaps} id={id} placeholder={t('Value')} value={cap.value}
        onChange={(e) => !isNaN(parseInt(e.target.value, 10)) ? onSetCapabilityParam(parseInt(e.target.value, 10)) : onSetCapabilityParam(undefined)} onPressEnter={onPressEnter} />;
      case 'object':
      case 'json_object':
        return <Input disabled={isEditingDesiredCaps} id={id} type={INPUT.TEXTAREA} rows={4} placeholder={t('Value')} value={cap.value}
          onChange={(e) => onSetCapabilityParam(e.target.value)} />;
      case 'file': return <div className={SessionStyles.fileControlWrapper}>
        <Input disabled={isEditingDesiredCaps} id={id} placeholder={t('Value')} value={cap.value} addonAfter={buttonAfter(cap.value)} onPressEnter={onPressEnter}/>
      </div>;

      default:
        throw `Invalid cap type: ${cap.type}`;
    }
  }
}
