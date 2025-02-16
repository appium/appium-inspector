import {ClearOutlined, CodeOutlined, CopyOutlined, PicRightOutlined} from '@ant-design/icons';
import {Button, Card, Select, Space, Tooltip} from 'antd';
import hljs from 'highlight.js';

import {BUTTON} from '../../constants/antd-types';
import frameworks from '../../lib/client-frameworks';
import {copyToClipboard} from '../../polyfills';
import InspectorStyles from './Inspector.module.css';

const Recorder = (props) => {
  const {showBoilerplate, recordedActions, actionFramework, t} = props;

  const code = (raw = true) => {
    const {serverDetails, sessionCaps} = props;
    const {serverUrl, serverUrlParts} = serverDetails;

    let framework = new frameworks[actionFramework](serverUrl, serverUrlParts, sessionCaps);
    framework.actions = recordedActions;
    const rawCode = framework.getCodeString(showBoilerplate);
    if (raw) {
      return rawCode;
    }
    return hljs.highlight(rawCode, {language: framework.language}).value;
  };

  const actionBar = () => {
    const {setActionFramework, toggleShowBoilerplate, clearRecording} = props;

    return (
      <Space size="middle">
        {!!recordedActions.length && (
          <Button.Group>
            <Tooltip title={t('Show/Hide Boilerplate Code')}>
              <Button
                onClick={toggleShowBoilerplate}
                icon={<PicRightOutlined />}
                type={showBoilerplate ? BUTTON.PRIMARY : BUTTON.DEFAULT}
              />
            </Tooltip>
            <Tooltip title={t('Copy code to clipboard')}>
              <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(code())} />
            </Tooltip>
            <Tooltip title={t('Clear Actions')}>
              <Button icon={<ClearOutlined />} onClick={clearRecording} />
            </Tooltip>
          </Button.Group>
        )}
        <Select
          defaultValue={actionFramework}
          onChange={setActionFramework}
          className={InspectorStyles['framework-dropdown']}
        >
          {Object.keys(frameworks).map((f) => (
            <Select.Option value={f} key={f}>
              {frameworks[f].readableName}
            </Select.Option>
          ))}
        </Select>
      </Space>
    );
  };

  return (
    <Card
      title={
        <span>
          <CodeOutlined /> {t('Recorder')}
        </span>
      }
      className={InspectorStyles['interaction-tab-card']}
      extra={actionBar()}
    >
      {!recordedActions.length && (
        <div className={InspectorStyles['no-recorded-actions']}>
          {t('enableRecordingAndPerformActions')}
        </div>
      )}
      {!!recordedActions.length && (
        <pre className={InspectorStyles['recorded-code']}>
          <code dangerouslySetInnerHTML={{__html: code(false)}} />
        </pre>
      )}
    </Card>
  );
};

export default Recorder;
