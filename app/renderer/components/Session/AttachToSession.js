import React, { Component } from 'react';
import { Form, Card, Select, Button, Row, Col } from 'antd';
import SessionCSS from './Session.css';
import {
  ReloadOutlined
} from '@ant-design/icons';
import {ServerTypes} from '../../actions/Session';

const FormItem = Form.Item;

function formatCaps (caps) {
  let importantCaps = [caps.app, caps.platformName, caps.deviceName];
  if (caps.automationName) {
    importantCaps.push(caps.automationName);
  }
  return importantCaps.join(', ').trim();
}

function formatCapsBrowserstack (caps) {
  let importantCaps = formatCaps(caps).split(', ');
  if (caps.sessionName) {
    importantCaps.push(caps.sessionName);
  }
  return importantCaps.join(', ').trim();
}

function formatCapsLambdaTest (session) {
  let caps, deviceName = session.deviceName;
  if (session.capabilities) {
    caps = session.capabilities;
    deviceName = session.capabilities.desired ? session.capabilities.desired.deviceName : session.capabilities.deviceName;
  } else if (session.desired) {
    caps = session.desired;
    deviceName = session.desired.deviceName;
  } else {
    caps = session;
  }
  let importantCaps = [deviceName, caps.platformName, caps.platformVersion];
  return importantCaps.join(', ').trim();
}

export default class AttachToSession extends Component {

  getSessionId(session) {
    return session.id || session.sessionId;
  }

  getSessionInfo (session, serverType) {
    switch (serverType) {
      case ServerTypes.browserstack:
        return `${session.id} — ${formatCapsBrowserstack(session.capabilities)}`;
      case ServerTypes.lambdatest:
        return `${session.id !== null ? session.id : session.sessionId} - ${formatCapsLambdaTest(session)}`;
      default:
        return `${session.id} — ${formatCaps(session.capabilities)}`;
    }
  }

  getSessionId (session){
    return session.id || session.sessionId;
  }

  render () {
    let {serverType, attachSessId, setAttachSessId, runningAppiumSessions, getRunningSessions, t} = this.props;
    attachSessId = attachSessId || undefined;
    return (<Form>
      <FormItem>
        <Card>
          <p className={SessionCSS.localDesc}>{t('connectToExistingSessionInstructions')}<br/>{t('selectSessionIDInDropdown')}</p>
        </Card>
      </FormItem>
      <FormItem>
        <Row>
          <Col span={23}>
            <Select showSearch
              mode='AutoComplete'
              notFoundContent='None found'
              placeholder={t('enterYourSessionId')}
              value={attachSessId}
              onChange={(value) => setAttachSessId(value)}>
              {runningAppiumSessions.map((session) => <Select.Option key={this.getSessionId(session)} value={this.getSessionId(session)}>
                <div>{this.getSessionInfo(session, serverType)}</div>
              </Select.Option>)}
            </Select>
          </Col>
          <Col span={1}>
            <div className={SessionCSS.btnReload}>
              <Button
                onClick={getRunningSessions}
                icon={<ReloadOutlined/>} />
            </div>
          </Col>
        </Row>
      </FormItem>
    </Form>);
  }
}
