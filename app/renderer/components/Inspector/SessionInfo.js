import React, { Component } from 'react';
import { Table, Row, Col } from 'antd';
import SessionCodeBox from './SessionCodeBox';
import { withTranslation } from '../../util';
import InspectorStyles from './Inspector.css';
import formatJSON from 'format-json';

const SESSION_OBJ = {
  session_id: 'Session ID', session_url: 'Session URL',
  server_details: 'Server Details', session_length: 'Session Length',
  session_details: 'Session Details', active_appId: 'Currently Active App ID'
};

const OUTER_TABLE_KEY = 'sessionInfo';
const SESSION_TABLE_KEY = 'sessionDetails';
const SERVER_TABLE_KEY = 'serverDetails';

const SCROLL_DISTANCE_Y = 104;
const COLUMN_WIDTH = 200;
let SESSION_DETAILS;

class SessionInfo extends Component {

  constructor (props) {
    super(props);
    this.interval = null;
    this.state = { time: this.generateSessionTime() };
  }

  componentDidMount () {
    const {driver, getActiveAppId, getServerStatus, applyClientMethod} = this.props;
    const {isIOS, isAndroid} = driver.client;

    getActiveAppId(isIOS, isAndroid);
    getServerStatus();

    this.sessionDetails(applyClientMethod);
    this.interval = setInterval(() => {
      this.setState({
        time: this.generateSessionTime(),
      });
    }, 1000);
  }

  componentWillUnmount () {
    clearInterval(this.interval);
  }

  async sessionDetails (applyClientMethod) {
    SESSION_DETAILS = await applyClientMethod({methodName: 'getSession'});
  }

  generateSessionTime () {
    const { sessionStartTime } = this.props;
    const currentTime = Date.now();
    const timeDiff = currentTime - sessionStartTime;

    const hours = timeDiff / 3600000;
    const minutes = (hours - Math.floor(hours)) * 60;
    const seconds = (minutes - Math.floor(minutes)) * 60;

    const showTime = (time) => String(Math.floor(time)).padStart(2, '0');

    return `${showTime(hours)}:${showTime(minutes)}:${showTime(seconds)}`;
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
      render: outerTable ?
        (text) => this.generateSessionInfo(text)
        :
        (text) => typeof text === 'object' ?
          <pre>{formatJSON.plain(text)}</pre>
          :
          String(text)
    }];

    return outerTable ?
      <div className={InspectorStyles['session-info-table']}>
        <Row>
          <Col span={24}>
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              showHeader={false}
              bordered={true}
              size="small"
            />
          </Col>
        </Row>
        <div className={InspectorStyles['session-code-box']}>
          <Row>
            <SessionCodeBox {...this.props} />
          </Row>
        </div>
      </div>
      :
      <Table
        className={InspectorStyles['session-inner-table']}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        showHeader={false}
        size="small"
        scroll={{ y: SCROLL_DISTANCE_Y }}
      />;
  }

  generateSessionInfo (name) {
    const { driver, sessionDetails, appId, status } = this.props;
    const { host, path, port } = sessionDetails;
    const { sessionId, connectedUrl } = driver || '';

    const isOuterTable = false;

    const serverDetailsArray = [['host', host], ['path', path], ['port', port]];
    const sessionArray = SESSION_DETAILS != null ?
      Object.keys(SESSION_DETAILS).map(
        (key) => [key, (SESSION_DETAILS[key])])
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
        `${connectedUrl}session/${sessionId}`
        :
        'Error Fetching Session Url';

    switch (name) {
      case 'Session ID': return sessionId;
      case 'Session URL': return sessionUrl;
      case 'Server Details': return this.getTable([...serverDetailsArray, ...serverStatusArray],
        SERVER_TABLE_KEY, isOuterTable);
      case 'Session Length': return this.state.time;
      case 'Session Details': return this.getTable(sessionArray, SESSION_TABLE_KEY, isOuterTable);
      case 'Currently Active App ID': return appId;
      default: return name;
    }
  }

  render () {
    const isOuterTable = true;
    const sessionArray = Object.keys(SESSION_OBJ).map(
      (key) => [key, String(SESSION_OBJ[key])]);

    return this.getTable(sessionArray, OUTER_TABLE_KEY, isOuterTable);
  }
}

export default withTranslation(SessionInfo);