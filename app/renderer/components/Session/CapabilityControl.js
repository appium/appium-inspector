import React from 'react';
import { Switch, Input } from 'antd';
import SessionStyles from './Session.css';
import { remote, log } from '../../polyfills';
import { FileOutlined } from '@ant-design/icons';
import { INPUT } from '../AntdTypes';
import _ from 'lodash';
import { APPIUM_SESSION_EXTENSION } from '../../../main/helpers';

const getLocalFilePath = async () => {
  try {
    const {canceled, filePaths} = await remote.dialog.showOpenDialog({
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
};

const CapabilityControl = ({ cap, onSetCapabilityParam, onPressEnter, isEditingDesiredCaps, id, t }) => {
  switch (cap.type) {
    case 'text':
      return <Input disabled={isEditingDesiredCaps} id={id} placeholder={t('Value')} value={cap.value}
        onChange={(e) => onSetCapabilityParam(e.target.value)} onPressEnter={onPressEnter} className={SessionStyles.capsBoxFont} />;
    case 'boolean':
      return <Switch disabled={isEditingDesiredCaps} id={id} checkedChildren={'true'} unCheckedChildren={'false'}
        placeholder={t('Value')} checked={cap.value} onChange={(value) => onSetCapabilityParam(value)} />;
    case 'number':
      return <Input disabled={isEditingDesiredCaps} id={id} placeholder={t('Value')} value={cap.value}
        onChange={(e) => !isNaN(parseInt(e.target.value, 10)) ? onSetCapabilityParam(parseInt(e.target.value, 10)) : onSetCapabilityParam(undefined)}
        onPressEnter={onPressEnter} className={SessionStyles.capsBoxFont} />;
    case 'object':
    case 'json_object':
      return <Input disabled={isEditingDesiredCaps} id={id} type={INPUT.TEXTAREA} rows={4} placeholder={t('Value')}
        value={cap.value} onChange={(e) => onSetCapabilityParam(e.target.value)} className={SessionStyles.capsBoxFont} />;
    case 'file':
      return <div className={SessionStyles.fileControlWrapper}>
        <Input disabled={isEditingDesiredCaps} id={id} placeholder={t('Value')} value={cap.value}
          onPressEnter={onPressEnter} className={SessionStyles.capsBoxFont}
          addonAfter={
            <FileOutlined className={SessionStyles['filepath-button']}
              onClick={async () => onSetCapabilityParam(await getLocalFilePath() || cap.value)} />
          } />
      </div>;
    default:
      throw `Invalid cap type: ${cap.type}`;
  }
};

export default CapabilityControl;
