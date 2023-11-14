import React from 'react';
import {Form, Card, Select, Button, Row, Col} from 'antd';
import SessionStyles from './Session.css';
import {ReloadOutlined} from '@ant-design/icons';
import {ServerTypes} from '../../actions/Session';

const formatCaps = (caps) => {
  let importantCaps = [caps.app, caps.platformName, caps.deviceName];
  if (caps.automationName) {
    importantCaps.push(caps.automationName);
  }
  return importantCaps.join(', ').trim();
};

const formatCapsBrowserstack = (caps) => {
  let importantCaps = formatCaps(caps).split(', ');
  if (caps.sessionName) {
    importantCaps.push(caps.sessionName);
  }
  return importantCaps.join(', ').trim();
};

const formatCapsLambdaTest = (caps) => {
  if (caps.hasOwnProperty.call(caps, 'capabilities')) {
    caps = caps.capabilities;
  }
  const deviceName = caps.desired ? caps.desired.deviceName : caps.deviceName;
  const importantCaps = [deviceName, caps.platformName, caps.platformVersion];
  return importantCaps.join(', ').trim();
};

const getSessionInfo = (session, serverType) => {
  switch (serverType) {
    case ServerTypes.browserstack:
      return `${session.id} — ${formatCapsBrowserstack(session.capabilities)}`;
    case ServerTypes.lambdatest:
      return `${session.id} - ${formatCapsLambdaTest(session.capabilities)}`;
    default:
      return `${session.id} — ${formatCaps(session.capabilities)}`;
  }
};

const AttachToSession = ({
  serverType,
  attachSessId,
  setAttachSessId,
  runningAppiumSessions,
  getRunningSessions,
  t,
}) => (
  <Form>
    <Form.Item>
      <Card>
        <p className={SessionStyles.localDesc}>
          {t('connectToExistingSessionInstructions')}
          <br />
          {t('selectSessionIDInDropdown')}
        </p>
      </Card>
    </Form.Item>
    <Form.Item>
      <Row>
        <Col span={23}>
          <Select
            showSearch
            mode="AutoComplete"
            notFoundContent="None found"
            placeholder={t('enterYourSessionId')}
            value={attachSessId || undefined}
            onChange={(value) => setAttachSessId(value)}
          >
            {runningAppiumSessions.map((session) => (
              <Select.Option key={session.id} value={session.id}>
                <div>{getSessionInfo(session, serverType)}</div>
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col span={1}>
          <div className={SessionStyles.btnReload}>
            <Button onClick={getRunningSessions} icon={<ReloadOutlined />} />
          </div>
        </Col>
      </Row>
    </Form.Item>
  </Form>
);

export default AttachToSession;
