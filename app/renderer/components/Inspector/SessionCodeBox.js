import React from 'react';
import { Card, Tooltip, Button, Select, Space } from 'antd';
import { CopyOutlined, CodeOutlined } from '@ant-design/icons';
import InspectorStyles from './Inspector.css';
import frameworks from '../../lib/client-frameworks';
import { highlight } from 'highlight.js';
import { clipboard } from '../../polyfills';

const SessionCodeBox = ({ actionFramework, setActionFramework, sessionDetails, t }) => {

  const code = (raw = true) => {
    const { host, port, path, https, desiredCapabilities } = sessionDetails;
    const framework = new frameworks[actionFramework](host, port, path, https, desiredCapabilities);
    const rawCode = framework.getCodeString(true);
    if (raw) {
      return rawCode;
    }

    return highlight(framework.language, rawCode, true).value;
  };

  const actionBar = () => <Space size='middle'>
    <Tooltip title={t('Copy code to clipboard')}>
      <Button
        icon={<CopyOutlined/>}
        onClick={() => clipboard.writeText(code())} />
    </Tooltip>
    <Select defaultValue={actionFramework} onChange={setActionFramework}
      className={InspectorStyles['framework-dropdown']}>
      {Object.keys(frameworks).map((f) =>
        <Select.Option value={f} key={f}>{frameworks[f].readableName}</Select.Option>
      )}
    </Select>
  </Space>;

  return (
    <Card title={<span><CodeOutlined /> {t('Start this Kind of Session with Code')}</span>}
      extra={actionBar()}>
      <div className={InspectorStyles['recorded-code']} dangerouslySetInnerHTML={{__html: code(false)}} />
    </Card>
  );
};

export default SessionCodeBox;
