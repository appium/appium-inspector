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
import { ALERT } from '../AntdTypes';

export default class FormattedCaps extends Component {

  setCapsTitle (title, isEditingDesiredCapsName) {
    const {setDesiredCapsName, desiredCapsName} = this.props;
    if (!title) {
      return 'JSON Representation';
    } else if (!isEditingDesiredCapsName) {
      return title;
    } else {
      return <input
        onChange={(e) => setDesiredCapsName(e.target.value)}
        value={desiredCapsName}
        className={SessionStyles.capsEditorTitle}
      />;
    }
  }

  setCapsTitleButtons (title, isEditingDesiredCapsName, t) {
    const {startDesiredCapsNameEditor, abortDesiredCapsNameEditor, saveDesiredCapsName} = this.props;
    if (!title) {
      return null;
    } else if (!isEditingDesiredCapsName) {
      return <Tooltip title={t('Edit')}>
        <Button
          size='small'
          onClick={startDesiredCapsNameEditor}
          icon={<EditOutlined/>}
          className={SessionStyles.capsNameEditorButton}/>
      </Tooltip>;
    } else {
      return <div><Tooltip title={t('Cancel')}>
        <Button
          size='small'
          onClick={abortDesiredCapsNameEditor}
          icon={<CloseOutlined/>}
          className={SessionStyles.capsNameEditorButton} />
      </Tooltip>
      <Tooltip title={t('Save')}>
        <Button
          size='small'
          onClick={saveDesiredCapsName}
          icon={<SaveOutlined/>}
          className={SessionStyles.capsNameEditorButton} />
      </Tooltip></div>;
    }
  }

  getFormattedJSON (caps) {
    return formatJSON.plain(getCapsObject(caps));
  }

  render () {
    const {caps, title, isEditingDesiredCapsName, isEditingDesiredCaps, startDesiredCapsEditor, abortDesiredCapsEditor,
           saveRawDesiredCaps, setRawDesiredCaps, rawDesiredCaps, isValidCapsJson, invalidCapsJsonReason, t} = this.props;
    return caps && <Card
      className={SessionStyles.formattedCaps}
      title={this.setCapsTitle(title, isEditingDesiredCapsName)}
      extra={this.setCapsTitleButtons(title, isEditingDesiredCapsName, t)}
    >
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
      {isEditingDesiredCaps && <div className={SessionStyles.capsEditor}>
        <textarea onChange={(e) => setRawDesiredCaps(e.target.value)} value={rawDesiredCaps}
          className={`${SessionStyles.capsEditorBody} ${isValidCapsJson ? SessionStyles.capsEditorBodyFull : SessionStyles.capsEditorBodyResized}`}
        />
        {!isValidCapsJson && <Alert message={invalidCapsJsonReason} type={ALERT.ERROR} />}
      </div>}
      {!isEditingDesiredCaps && <div className={SessionStyles.formattedCapsBody}>
        <pre>{this.getFormattedJSON(caps)}</pre>
      </div>}
    </Card>;
  }
}
