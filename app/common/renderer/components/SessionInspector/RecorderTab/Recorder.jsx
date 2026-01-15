import {IconEraser, IconEyeCode, IconFiles, IconVideo} from '@tabler/icons-react';
import {Button, Card, Flex, Select, Space, Tooltip} from 'antd';
import hljs from 'highlight.js';
import _ from 'lodash';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import {copyToClipboard} from '../../../polyfills.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Recorder.module.css';

const Recorder = (props) => {
  const {showBoilerplate, recordedActions, clientFramework} = props;
  const {t} = useTranslation();

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
                icon={<IconEyeCode size={18} />}
                type={showBoilerplate ? BUTTON.PRIMARY : BUTTON.DEFAULT}
              />
            </Tooltip>
            <Tooltip title={t('Copy code to clipboard')}>
              <Button icon={<IconFiles size={18} />} onClick={() => copyToClipboard(code())} />
            </Tooltip>
            <Tooltip title={t('Clear Actions')}>
              <Button icon={<IconEraser size={18} />} onClick={clearRecording} />
            </Tooltip>
          </Space.Compact>
        )}
        <Select
          defaultValue={clientFramework}
          value={clientFramework}
          onChange={setClientFramework}
          className={inspectorStyles.frameworkDropdown}
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
        <Flex gap={4} align="center">
          <IconVideo size={18} />
          {t('Recorder')}
        </Flex>
      }
      className={inspectorStyles.interactionTabCard}
      extra={actionBar()}
    >
      {!recordedActions.length && (
        <div className={styles.noRecordedActions}>{t('enableRecordingAndPerformActions')}</div>
      )}
      {!!recordedActions.length && (
        <pre className={inspectorStyles.recordedCode}>
          {/* eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml --
          We assume that the user considers their own input and the connected server to be safe */}
          <code dangerouslySetInnerHTML={{__html: code(false)}} />
        </pre>
      )}
    </Card>
  );
};

export default Recorder;
