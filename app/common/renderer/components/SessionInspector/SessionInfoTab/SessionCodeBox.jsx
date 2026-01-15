import {IconCode, IconFiles} from '@tabler/icons-react';
import {Button, Card, Flex, Select, Space, Tooltip} from 'antd';
import hljs from 'highlight.js';
import _ from 'lodash';
import {useTranslation} from 'react-i18next';

import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import {copyToClipboard} from '../../../polyfills.js';
import inspectorStyles from '../SessionInspector.module.css';

const SessionCodeBox = (props) => {
  const {clientFramework, setClientFramework} = props;
  const {t} = useTranslation();

  const code = (raw = true) => {
    const {serverDetails, sessionCaps} = props;
    const {serverUrl, serverUrlParts} = serverDetails;

    const ClientFrameworkClass = CLIENT_FRAMEWORK_MAP[clientFramework];
    const framework = new ClientFrameworkClass(serverUrl, serverUrlParts, sessionCaps);
    const rawCode = framework.getCodeString(true);
    if (raw) {
      return rawCode;
    }

    return hljs.highlight(rawCode, {language: ClientFrameworkClass.highlightLang}).value;
  };

  const actionBar = () => (
    <Space size="middle">
      <Tooltip title={t('Copy code to clipboard')}>
        <Button icon={<IconFiles size={18} />} onClick={() => copyToClipboard(code())} />
      </Tooltip>
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

  return (
    <Card
      title={
        <Flex gap={4} align="center">
          <IconCode size={18} />
          {t('Start this Kind of Session with Code')}
        </Flex>
      }
      extra={actionBar()}
    >
      <pre className={inspectorStyles.recordedCode}>
        {/* eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml --
        We assume that the user considers their own input and the connected server to be safe */}
        <code dangerouslySetInnerHTML={{__html: code(false)}} />
      </pre>
    </Card>
  );
};

export default SessionCodeBox;
