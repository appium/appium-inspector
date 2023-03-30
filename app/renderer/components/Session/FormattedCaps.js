import React, { Component } from 'react';
import formatJSON from 'format-json';
import SessionStyles from './Session.css';
import { Card, Button, Alert, Tooltip } from 'antd';
import { getCapsObject } from '../../actions/Session.js';
import {
  CloseOutlined,
  SaveOutlined,
  EditOutlined
} from '@ant-design/icons';
import { remote } from '../../polyfills';
import { HEIGHT_OF_SESSION_CONFIG_AREA } from './Layout';
import { ALERT } from '../../../../gui-common/components/AntdTypes';

export default class FormattedCaps extends Component {

  getFormattedJSON (caps) {
    return formatJSON.plain(getCapsObject(caps));
  }

  render () {
    const {caps, title, isEditingDesiredCaps, startDesiredCapsEditor, abortDesiredCapsEditor, saveRawDesiredCaps, setRawDesiredCaps, rawDesiredCaps,
           isValidCapsJson, invalidCapsJsonReason, t} = this.props;
    return caps && <div className={SessionStyles.formattedCapsCont}>
      <Card
        title={title || 'JSON Representation'}
        className={SessionStyles.formattedCaps}
        bodyStyle={{maxHeight: remote.getCurrentWindow().getSize()[1] - HEIGHT_OF_SESSION_CONFIG_AREA}}>

        <div className={SessionStyles.capsEditorControls}>
          {isEditingDesiredCaps && <Tooltip title={t('Cancel')}>
            <Button
              onClick={abortDesiredCapsEditor}
              icon={<CloseOutlined/>}
              className={SessionStyles.capsEditorButton} />
          </Tooltip> }
          {isEditingDesiredCaps && <Tooltip title={t('Save')}>
            <Button
              onClick={saveRawDesiredCaps}
              icon={<SaveOutlined/>}
              className={SessionStyles.capsEditorButton} />
          </Tooltip>}
          {!isEditingDesiredCaps && <Tooltip title={t('Edit Raw JSON')} placement="topRight" >
            <Button
              onClick={startDesiredCapsEditor}
              icon={<EditOutlined/>} />
          </Tooltip> }
        </div>
        {isEditingDesiredCaps && <div>
          <textarea rows='9' onChange={(e) => setRawDesiredCaps(e.target.value)} value={rawDesiredCaps} className={SessionStyles.capsEditor} />
          {!isValidCapsJson && <Alert message={invalidCapsJsonReason} type={ALERT.ERROR} />}
        </div>}
        {!isEditingDesiredCaps && <div>
          <pre>{this.getFormattedJSON(caps)}</pre>
        </div>}
      </Card>
    </div>;
  }
}
