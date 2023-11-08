import { clipboard } from '../../polyfills';
import React from 'react';
import { Card, Select, Space, Tooltip, Button } from 'antd';
import InspectorStyles from './Inspector.css';
import frameworks from '../../lib/client-frameworks';
import { highlight } from 'highlight.js';
import { PicRightOutlined, CopyOutlined, ClearOutlined, CodeOutlined } from '@ant-design/icons';
import { BUTTON } from '../AntdTypes';

const Recorder = (props) => {
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
    const { setActionFramework, toggleShowBoilerplate, clearRecording } = props;

    return <Space size='middle'>
      {!!recordedActions.length &&
        <Button.Group>
          <Tooltip title={t('Show/Hide Boilerplate Code')}>
            <Button
              onClick={toggleShowBoilerplate}
              icon={<PicRightOutlined/>}
              type={showBoilerplate ? BUTTON.PRIMARY : BUTTON.DEFAULT} />
          </Tooltip>
          <Tooltip title={t('Copy code to clipboard')}>
            <Button
              icon={<CopyOutlined/>}
              onClick={() => clipboard.writeText(code())} />
          </Tooltip>
          <Tooltip title={t('Clear Actions')}>
            <Button
              icon={<ClearOutlined/>}
              onClick={clearRecording} />
          </Tooltip>
        </Button.Group>
      }
      <Select defaultValue={actionFramework} onChange={setActionFramework}
        className={InspectorStyles['framework-dropdown']}>
        {Object.keys(frameworks).map((f) =>
          <Select.Option value={f} key={f}>{frameworks[f].readableName}</Select.Option>
        )}
      </Select>
    </Space>;
  };

  const highlightedCode = code(false);

  return (
    <Card title={<span><CodeOutlined /> {t('Recorder')}</span>}
      className={InspectorStyles['interaction-tab-card']}
      extra={actionBar()}>
      {!recordedActions.length &&
        <div className={InspectorStyles['no-recorded-actions']}>
          {t('enableRecordingAndPerformActions')}
        </div>
      }
      {!!recordedActions.length &&
        <div className={InspectorStyles['recorded-code']}
          dangerouslySetInnerHTML={{__html: highlightedCode}} />
      }
    </Card>
  );
};

export default Recorder;
