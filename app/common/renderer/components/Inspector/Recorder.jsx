import {ClearOutlined, CodeOutlined, CopyOutlined, PicRightOutlined} from '@ant-design/icons';
import {Button, Card, Select, Space, Tooltip} from 'antd';
import hljs from 'highlight.js';
import _ from 'lodash';

import {BUTTON} from '../../constants/antd-types';
import {CLIENT_FRAMEWORK_MAP} from '../../lib/client-frameworks/map';
import {copyToClipboard} from '../../polyfills';
import InspectorStyles from './Inspector.module.css';

const Recorder = (props) => {
  const {showBoilerplate, recordedActions, clientFramework, t} = props;

  const code = (raw = true) => {
    const {serverDetails, sessionCaps} = props;
    const {serverUrl, serverUrlParts} = serverDetails;

    const ClientFrameworkClass = CLIENT_FRAMEWORK_MAP[clientFramework];
    const framework = new ClientFrameworkClass(serverUrl, serverUrlParts, sessionCaps);
    framework.actions = recordedActions;
    const rawCode = framework.getCodeString(showBoilerplate);
    if (raw) {
      return rawCode;
    }
    return hljs.highlight(rawCode, {language: ClientFrameworkClass.highlightLang}).value;
  };

  const actionBar = () => {
    const {setClientFramework, toggleShowBoilerplate, clearRecording} = props;

    return (
      <Space size="middle">
        {!!recordedActions.length && (
          <Space.Compact>
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
          </Space.Compact>
        )}
        <Select
          defaultValue={clientFramework}
          value={clientFramework}
          onChange={setClientFramework}
          className={InspectorStyles['framework-dropdown']}
          options={_.map(CLIENT_FRAMEWORK_MAP, (fwClass, fwId) => ({
            value: fwId,
            label: fwClass.readableName,
          }))}
        />
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
