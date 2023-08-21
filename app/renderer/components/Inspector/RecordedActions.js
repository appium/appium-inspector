import { clipboard } from '../../polyfills';
import React from 'react';
import { Card, Select, Tooltip, Button } from 'antd';
import InspectorStyles from './Inspector.css';
import frameworks from '../../lib/client-frameworks';
import { highlight } from 'highlight.js';
import { ExportOutlined, CopyOutlined, DeleteOutlined, CloseOutlined, CodeOutlined } from '@ant-design/icons';
import { BUTTON } from '../AntdTypes';

const RecordedActions = (props) => {
  const { showBoilerplate, recordedActions, actionFramework, t } = props;

  const code = (raw = true) => {
    const { host, port, path, https, desiredCapabilities } = props.sessionDetails;

    let framework = new frameworks[actionFramework](host, port, path, https, desiredCapabilities);
    framework.actions = recordedActions;
    const rawCode = framework.getCodeString(showBoilerplate);
    if (raw) {
      return rawCode;
    }
    return highlight(framework.language, rawCode, true).value;
  };

  const actionBar = () => {
    const { setActionFramework, toggleShowBoilerplate, clearRecording, closeRecorder, isRecording } = props;

    return <div>
      {!!recordedActions.length &&
        <Select defaultValue={actionFramework} onChange={setActionFramework}
          className={InspectorStyles['framework-dropdown']} size="small">
          {Object.keys(frameworks).map((f) =>
            <Select.Option value={f} key={f}>{frameworks[f].readableName}</Select.Option>
          )}
        </Select>
      }
      {(!!recordedActions.length || !isRecording) &&
        <Button.Group size="small">
          {!!recordedActions.length &&
          <Tooltip title={t('Show/Hide Boilerplate Code')}>
            <Button
              onClick={toggleShowBoilerplate}
              icon={<ExportOutlined/>}
              type={showBoilerplate ? BUTTON.PRIMARY : BUTTON.DEFAULT} />
          </Tooltip>
          }
          {!!recordedActions.length &&
          <Tooltip title={t('Copy code to clipboard')}>
            <Button
              icon={<CopyOutlined/>}
              onClick={() => clipboard.writeText(code())} />
          </Tooltip>
          }
          {!!recordedActions.length &&
          <Tooltip title={t('Clear Actions')}>
            <Button
              icon={<DeleteOutlined/>}
              onClick={clearRecording} />
          </Tooltip>
          }
          {!isRecording &&
          <Tooltip title={t('Close Recorder')}>
            <Button
              icon={<CloseOutlined/>}
              onClick={closeRecorder} />
          </Tooltip>
          }
        </Button.Group>
      }
    </div>;
  };

  const highlightedCode = code(false);

  return (
    <Card title={<span><CodeOutlined /> {t('Recorder')}</span>}
      className={InspectorStyles['recorded-actions']}
      extra={actionBar()}>
      {!recordedActions.length &&
        <div className={InspectorStyles['no-recorded-actions']}>
          {t('Perform some actions to see code show up here')}
        </div>
      }
      {!!recordedActions.length &&
        <div className={InspectorStyles['recorded-code']}
          dangerouslySetInnerHTML={{__html: highlightedCode}} />
      }
    </Card>
  );
};

export default RecordedActions;
