import {ReloadOutlined} from '@ant-design/icons';
import {Button, Card, Col, Form, Row, Select, Tooltip} from 'antd';
import _ from 'lodash';
import React from 'react';

import {ServerTypes} from '../../actions/Session';
import SessionStyles from './Session.module.css';

class DefaultSessionDescription {
  constructor(caps) {
    this._caps = caps;
  }

  // sessionName is only populated for cloud providers
  _fetchSessionName() {
    return this._caps.sessionName;
  }

  _fetchDeviceInfo() {
    return this._caps.deviceName || this._caps.avd || this._caps.udid;
  }

  _fetchPlatformInfo() {
    if (this._caps.platformName) {
      const platformInfo = this._caps.platformVersion
        ? `${this._caps.platformName} ${this._caps.platformVersion}`
        : this._caps.platformName;
      return platformInfo;
    }
  }

  _fetchAutomationName() {
    return this._caps.automationName;
  }

  _fetchAppInfo() {
    return this._caps.app || this._caps.bundleId || this._caps.appPackage;
  }

  transform() {
    const suffixItems = [
      this._fetchSessionName(),
      this._fetchDeviceInfo(),
      this._fetchPlatformInfo(),
      this._fetchAutomationName(),
      this._fetchAppInfo(),
    ];
    return _.compact(suffixItems).join(' / ');
  }
}

class LambdaTestSessionDescription extends DefaultSessionDescription {
  constructor(caps) {
    super();
    if ('capabilities' in caps) {
      this._caps = caps.capabilities;
    }
  }

  _fetchDeviceInfo() {
    if ('desired' in this._caps) {
      return this._caps.desired.deviceName;
    } else {
      return this._caps.deviceName;
    }
  }
}

const getSessionDescription = (caps, serverType) => {
  switch (serverType) {
    case ServerTypes.lambdatest:
      return new LambdaTestSessionDescription(caps);
    default:
      return new DefaultSessionDescription(caps);
  }
};

const getSessionInfo = (session, serverType) =>
  `${session.id} — ${getSessionDescription(session.capabilities, serverType).transform()}`;

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
