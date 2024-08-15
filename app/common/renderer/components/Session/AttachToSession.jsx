import {ReloadOutlined} from '@ant-design/icons';
import {Button, Card, Col, Form, Row, Select, Tooltip} from 'antd';
import _ from 'lodash';
import React from 'react';

import {ServerTypes} from '../../actions/Session';
import SessionStyles from './Session.module.css';

const formatCaps = (initialCaps, serverType) => {
  let returnedCaps = [];
  const caps =
    serverType === ServerTypes.lambdatest && 'capabilities' in initialCaps
      ? initialCaps.capabilities
      : initialCaps;
  // add sessionName (BrowserStack and other cloud providers only)
  returnedCaps.push(caps.sessionName);
  // add deviceName OR avd OR udid
  const deviceName =
    serverType === ServerTypes.lambdatest && 'desired' in caps
      ? caps.desired.deviceName
      : caps.deviceName;
  returnedCaps.push(deviceName || caps.avd || caps.udid);
  // add platformName and platformVersion
  if (caps.platformName) {
    const platformInfo = caps.platformVersion
      ? `${caps.platformName} ${caps.platformVersion}`
      : caps.platformName;
    returnedCaps.push(platformInfo);
  }
  // add automationName
  returnedCaps.push(caps.automationName);
  // add app OR bundleId OR appPackage
  returnedCaps.push(caps.app || caps.bundleId || caps.appPackage);
  // omit all values that were not found in caps
  const nonEmptyCaps = _.reject(returnedCaps, _.isNil);
  return nonEmptyCaps.join(' / ').trim();
};

const getSessionInfo = (session, serverType) =>
  `${session.id} — ${formatCaps(session.capabilities, serverType)}`;

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
            notFoundContent={t('noResultsFound')}
            placeholder={t('enterYourSessionId')}
            value={attachSessId || undefined}
            onChange={(value) => setAttachSessId(value)}
          >
            {runningAppiumSessions
              .slice()
              .reverse()
              .map((session) => (
                // list is reversed in order to place the most recent sessions at the top
                // slice() is added because reverse() mutates the original array
                <Select.Option key={session.id} value={session.id}>
                  <div>{getSessionInfo(session, serverType)}</div>
                </Select.Option>
              ))}
          </Select>
        </Col>
        <Col span={1}>
          <Tooltip title={t('Reload')}>
            <Button
              className={SessionStyles.btnReload}
              onClick={getRunningSessions}
              icon={<ReloadOutlined />}
            />
          </Tooltip>
        </Col>
      </Row>
    </Form.Item>
  </Form>
);

export default AttachToSession;
