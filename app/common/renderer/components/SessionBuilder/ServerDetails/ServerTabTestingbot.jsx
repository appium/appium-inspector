import {Col, Input, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {INPUT} from '../../../constants/antd-types.js';

const testingbotUsernamePlaceholder = (t) => {
  if (process.env.TB_KEY) {
    return t('usingDataFoundIn', {environmentVariable: 'TB_KEY'});
  }
  return t('yourUsername');
};

const testingbotAccessKeyPlaceholder = (t) => {
  if (process.env.TB_SECRET) {
    return t('usingDataFoundIn', {environmentVariable: 'TB_SECRET'});
  }
  return t('yourAccessKey');
};

const ServerTabTestingbot = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Row gutter={8}>
      <Col span={12}>
        <Space.Compact block>
          <Space.Addon>{t('TestingBot Key')}</Space.Addon>
          <Input
            id="testingbotKey"
            placeholder={testingbotUsernamePlaceholder(t)}
            value={server.testingbot.username}
            onChange={(e) => setServerParam('username', e.target.value)}
          />
        </Space.Compact>
      </Col>
      <Col span={12}>
        <Space.Compact block>
          <Space.Addon>{t('TestingBot Secret')}</Space.Addon>
          <Input
            id="testingbotSecret"
            type={INPUT.PASSWORD}
            placeholder={testingbotAccessKeyPlaceholder(t)}
            value={server.testingbot.accessKey}
            onChange={(e) => setServerParam('accessKey', e.target.value)}
          />
        </Space.Compact>
      </Col>
    </Row>
  );
};

export default ServerTabTestingbot;
