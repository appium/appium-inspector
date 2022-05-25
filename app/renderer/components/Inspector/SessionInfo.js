import React, { Component } from 'react';
import { Table, Card } from 'antd';
import SessionCodeBox from './SessionCodeBox';
import { withTranslation } from '../../util';

const SESSION_OBJ = {
  session_id: 'Session ID', session_url: 'Session URL',
  server_details: 'Server Details', session_length: 'Session Length',
  session_caps: 'Session Capabilities', server_response: 'Server Details from Server',
  active_appId: 'Currently Active App ID'
};

const SCROLL_DISTANCE_Y = 105;
const SCROLL_DISTANCE_X = 100;
const COLUMN_WIDTH = 200;

class SessionInfo extends Component {

  componentDidMount () {
    const {driver, getActiveAppId, getServerStatus} = this.props;
    const {isIOS, isAndroid} = driver.client;

    getActiveAppId(isIOS, isAndroid);
    getServerStatus();
  }

  generateSessionTime () {
    const { sessionStartTime } = this.props;
    const currentTime = Date.now();
    const time = currentTime - sessionStartTime;

    const hourDiff = time / 3600000;
    const hours = Math.floor(hourDiff);

    const minDiff = (hourDiff - hours) * 60;
    const minutes = Math.floor(minDiff);

    const secDiff = (minDiff - minutes) * 60;
    const seconds = Math.floor(secDiff);

    return `${minutes}:${(seconds < 10) ? '0' : ''}${seconds}`;
  }

  getTable (tableValues, keyName, outerTable) {

    const keyValue = `${keyName}_value`;
    const dataSource = tableValues.map(
      ([name, value]) =>
        ({key: name, [keyName]: outerTable ? value : name, [keyValue]: value }));

    const columns = [{
      dataIndex: keyName,
      key: keyName,
      ...(outerTable && { width: COLUMN_WIDTH })
    }, {
      dataIndex: keyValue,
      key: keyValue,
      ...(outerTable && { render: (text) => this.generateSessionInfo(text) })
    }];

    return outerTable ?
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        showHeader={false}
        footer={() => <SessionCodeBox {...this.props} />} />
      :
      <Card>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          showHeader={false}
          scroll={{ y: SCROLL_DISTANCE_Y, x: SCROLL_DISTANCE_X }}
        />
      </Card>;
  }

  generateSessionInfo (name) {
    const { driver, sessionDetails, appId, status } = this.props;
    const { host, path, port, desiredCapabilities } = sessionDetails;
    const { sessionId, connectedUrl } = driver || '';

    const isOuterTable = false;

    const serverDetailsArray = [['host', host], ['path', path], ['port', port]];
    const capsArray = desiredCapabilities != null ?
      Object.keys(desiredCapabilities).map(
        (key) => [key, String(desiredCapabilities[key])])
      :
      [];
    const serverStatusArray = status != null ?
      Object.keys(status).map(
      (key) => [key, String(status[key])])
      :
      [];

    // TODO: Fetch URL from Cloud Providers
    const sessionUrl =
      sessionId && connectedUrl ?
        connectedUrl + sessionId
        :
        'Error Fetching Session Url';
    const intoHTML = (text) => <p>{text}</p>;

    switch (name) {
      case 'Session ID': return intoHTML(sessionId);
      case 'Session URL': return intoHTML(sessionUrl);
      case 'Server Details': return this.getTable(serverDetailsArray, 'serverDetails', isOuterTable);
      case 'Session Length': return intoHTML(this.generateSessionTime());
      case 'Session Capabilities': return this.getTable(capsArray, 'caps', isOuterTable);
      case 'Server Details from Server': return this.getTable(serverStatusArray, 'serverStatus', isOuterTable);
      case 'Currently Active App ID': return intoHTML(appId);
      default: return intoHTML('Invalid Header');
    }
  }

  render () {
    const isOuterTable = true;
    const sessionArray = Object.keys(SESSION_OBJ).map(
      (key) => [key, String(SESSION_OBJ[key])]);

    return this.getTable(sessionArray, 'session', isOuterTable);
  }
}

export default withTranslation(SessionInfo);