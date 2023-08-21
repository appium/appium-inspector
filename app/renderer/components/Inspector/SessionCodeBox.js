import React from 'react';
import { Card, Tooltip, Button, Select } from 'antd';
import { CopyOutlined, CodeOutlined } from '@ant-design/icons';
import InspectorStyles from './Inspector.css';
import frameworks from '../../lib/client-frameworks';
import { highlight } from 'highlight.js';
import { clipboard } from '../../polyfills';

const SessionCodeBox = ({ actionFramework, setActionFramework, sessionDetails, t }) => {

  const code = () => {
    const { host, port, path, https, desiredCapabilities } = sessionDetails;
    const framework = new frameworks[actionFramework](host, port, path, https, desiredCapabilities);
    const rawCode = framework.getCodeString(true);

    return highlight(framework.language, rawCode, true).value;
  };

  const actionBar = () => <div>
    <Select defaultValue={actionFramework} onChange={setActionFramework}
      className={InspectorStyles['framework-dropdown']} size='small'>
      {Object.keys(frameworks).map((f) =>
        <Select.Option value={f} key={f}>{frameworks[f].readableName}</Select.Option>
      )}
    </Select>
    <Tooltip title={t('Copy Code to Clipboard')}>
      <Button
        icon={<CopyOutlined/>}
        onClick={() => clipboard.writeText(code())}
        type='text' />
    </Tooltip>
  </div>;

  return (
    <Card title={<span><CodeOutlined /> {t('Start this Kind of Session with Code')}</span>}
      className={InspectorStyles['recorded-actions']}
      extra={actionBar()}>
      <div className={InspectorStyles['recorded-code']} dangerouslySetInnerHTML={{__html: code()}} />
    </Card>
  );
};

export default SessionCodeBox;
