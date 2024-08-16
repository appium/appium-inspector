import {ReloadOutlined} from '@ant-design/icons';
import {Button, Card, Col, Form, Row, Select, Tooltip} from 'antd';
import _ from 'lodash';
import React from 'react';

import {ServerTypes} from '../../actions/Session';
import SessionStyles from './Session.module.css';

// Format the session string for standard Appium server connections
const formatStandardCaps = (caps) => {
  let returnedCaps = [];
  // add deviceName OR avd OR udid
  returnedCaps.push(caps.deviceName || caps.avd || caps.udid);
  // add platformName and platformVersion
  const platformInfo = caps.platformVersion
    ? `${caps.platformName} ${caps.platformVersion}`
    : caps.platformName;
  returnedCaps.push(platformInfo);
  // add automationName
  returnedCaps.push(caps.automationName);
  // add app OR bundleId OR appPackage
  returnedCaps.push(caps.app || caps.bundleId || caps.appPackage);
  return returnedCaps;
};

// Format the session string for cloud service provider connections
const formatVendorCaps = (initialCaps, serverType) => {
  let returnedCaps = [];
  // LambdaTest may use a slightly different format
  // and package all caps in the 'capabilities' property
  const caps =
    serverType === ServerTypes.lambdatest && 'capabilities' in initialCaps
      ? initialCaps.capabilities
      : initialCaps;
  // add sessionName
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
  return returnedCaps;
};

const getSessionInfo = (session, serverType) => {
  const formattedCaps =
    serverType in [ServerTypes.remote, ServerTypes.local]
      ? formatStandardCaps(session.capabilities)
      : formatVendorCaps(session.capabilities, serverType);
  // omit all null or undefined values
  const nonEmptyCaps = _.reject(formattedCaps, _.isNil);
  const formattedCapsString = nonEmptyCaps.join(' / ').trim();
  return `${session.id} — ${formattedCapsString}`;
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
