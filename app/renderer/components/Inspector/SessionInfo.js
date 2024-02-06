import {Col, Row, Table} from 'antd';
import React, {useEffect, useRef, useState} from 'react';

import InspectorStyles from './Inspector.css';
import SessionCodeBox from './SessionCodeBox';

const SESSION_OBJ = {
  session_id: 'Session ID',
  session_url: 'Session URL',
  server_details: 'Server Details',
  session_length: 'Session Length',
  session_details: 'Session Details',
  active_appId: 'Currently Active App ID',
};

const OUTER_TABLE_KEY = 'sessionInfo';
const SESSION_TABLE_KEY = 'sessionDetails';
const SERVER_TABLE_KEY = 'serverDetails';

const SCROLL_DISTANCE_Y = 104;
const COLUMN_WIDTH = 200;
let SESSION_DETAILS;

const SessionInfo = (props) => {
  const {driver, t} = props;

  const sessionArray = Object.keys(SESSION_OBJ).map((key) => [key, String(SESSION_OBJ[key])]);

  const generateSessionTime = () => {
    const {sessionStartTime} = props;
    const currentTime = Date.now();
    const timeDiff = currentTime - sessionStartTime;

    const hours = timeDiff / 3600000;
    const minutes = (hours - Math.floor(hours)) * 60;
    const seconds = (minutes - Math.floor(minutes)) * 60;

    const showTime = (time) => String(Math.floor(time)).padStart(2, '0');

    return `${showTime(hours)}:${showTime(minutes)}:${showTime(seconds)}`;
  };

  const interval = useRef();
  const [time, setTime] = useState(generateSessionTime());

  const getTable = (tableValues, keyName, outerTable) => {
    const keyValue = `${keyName}_value`;
    const dataSource = tableValues.map(([name, value]) => ({
      key: name,
      [keyName]: outerTable ? t(value) : name,
      [keyValue]: value,
    }));

    const columns = [
      {
        dataIndex: keyName,
        key: keyName,
        ...(outerTable && {width: COLUMN_WIDTH}),
      },
      {
        dataIndex: keyValue,
        key: keyValue,
        render: outerTable
          ? (text) => generateSessionInfo(text)
          : (text) =>
              typeof text === 'object' ? <pre>{JSON.stringify(text, null, 2)}</pre> : String(text),
      },
    ];

    return outerTable ? (
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
          <SessionCodeBox {...props} />
        </div>
      </div>
    ) : (
      <Table
        className={InspectorStyles['session-inner-table']}
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        showHeader={false}
        size="small"
        scroll={{y: SCROLL_DISTANCE_Y}}
      />
    );
  };

  const generateSessionInfo = (name) => {
    const {sessionDetails, appId, status} = props;
    const {host, path, port} = sessionDetails;
    const {sessionId, connectedUrl} = driver || '';

    const serverDetailsArray = [
      ['host', host],
      ['path', path],
      ['port', port],
    ];
    const sessionArray =
      SESSION_DETAILS != null
        ? Object.keys(SESSION_DETAILS).map((key) => [key, SESSION_DETAILS[key]])
        : [];
    const serverStatusArray =
      status != null ? Object.keys(status).map((key) => [key, String(status[key])]) : [];

    // TODO: Fetch URL from Cloud Providers
    const sessionUrl =
      sessionId && connectedUrl
        ? `${connectedUrl}session/${sessionId}`
        : t('Error Fetching Session URL');

    switch (name) {
      case 'Session ID':
        return sessionId;
      case 'Session URL':
        return sessionUrl;
      case 'Server Details':
        return getTable([...serverDetailsArray, ...serverStatusArray], SERVER_TABLE_KEY, false);
      case 'Session Length':
        return time;
      case 'Session Details':
        return getTable(sessionArray, SESSION_TABLE_KEY, false);
      case 'Currently Active App ID':
        return appId;
      default:
        return name;
    }
  };

  useEffect(() => {
    const {getActiveAppId, getServerStatus, applyClientMethod} = props;
    const {isIOS, isAndroid} = driver.client;

    getActiveAppId(isIOS, isAndroid);
    getServerStatus();

    (async () => (SESSION_DETAILS = await applyClientMethod({methodName: 'getSession'})))();
    interval.current = setInterval(() => {
      setTime(generateSessionTime());
    }, 1000);

    return () => clearInterval(interval.current);
  }, []);

  return getTable(sessionArray, OUTER_TABLE_KEY, true);
};

export default SessionInfo;
