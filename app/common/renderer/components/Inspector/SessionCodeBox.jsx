import {CodeOutlined, CopyOutlined} from '@ant-design/icons';
import {Button, Card, Select, Space, Tooltip} from 'antd';
import hljs from 'highlight.js';
import _ from 'lodash';

import {CLIENT_FRAMEWORK_MAP} from '../../lib/client-frameworks/map';
import {copyToClipboard} from '../../polyfills';
import InspectorStyles from './Inspector.module.css';

const SessionCodeBox = (props) => {
  const {clientFramework, setClientFramework, t} = props;

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
        <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(code())} />
      </Tooltip>
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

  return (
    <Card
      title={
        <span>
          <CodeOutlined /> {t('Start this Kind of Session with Code')}
        </span>
      }
      extra={actionBar()}
    >
      <pre className={InspectorStyles['recorded-code']}>
        <code dangerouslySetInnerHTML={{__html: code(false)}} />
      </pre>
    </Card>
  );
};

export default SessionCodeBox;
