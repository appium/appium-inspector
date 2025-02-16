import {CodeOutlined, CopyOutlined} from '@ant-design/icons';
import {Button, Card, Select, Space, Tooltip} from 'antd';
import hljs from 'highlight.js';

import frameworks from '../../lib/client-frameworks';
import {copyToClipboard} from '../../polyfills';
import InspectorStyles from './Inspector.module.css';

const SessionCodeBox = ({actionFramework, setActionFramework, sessionDetails, t}) => {
  const code = (raw = true) => {
    const {serverUrl, serverUrlParts, formattedCaps} = sessionDetails;
    const framework = new frameworks[actionFramework](serverUrl, serverUrlParts, formattedCaps);
    const rawCode = framework.getCodeString(true);
    if (raw) {
      return rawCode;
    }

    return hljs.highlight(rawCode, {language: framework.language}).value;
  };

  const actionBar = () => (
    <Space size="middle">
      <Tooltip title={t('Copy code to clipboard')}>
        <Button icon={<CopyOutlined />} onClick={() => copyToClipboard(code())} />
      </Tooltip>
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
