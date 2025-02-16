import {Col, Row, Table} from 'antd';
import {useEffect, useRef, useState} from 'react';

import {SESSION_INFO_PROPS, SESSION_INFO_TABLE_PARAMS} from '../../constants/session-info';
import InspectorStyles from './Inspector.module.css';
import SessionCodeBox from './SessionCodeBox.jsx';

const SessionInfo = (props) => {
  const {driver, t} = props;

  const sessionArray = Object.keys(SESSION_INFO_PROPS).map((key) => [
    key,
    String(SESSION_INFO_PROPS[key]),
  ]);

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
        ...(outerTable && {width: SESSION_INFO_TABLE_PARAMS.COLUMN_WIDTH}),
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
        scroll={{y: SESSION_INFO_TABLE_PARAMS.SCROLL_DISTANCE_Y}}
      />
    );
  };

  const generateSessionInfo = (name) => {
    const {serverDetails, appId, status, flatSessionCaps} = props;
    const {serverUrl} = serverDetails;
    const {sessionId} = driver || '';

    const sessionArray =
      flatSessionCaps != null
        ? Object.keys(flatSessionCaps).map((key) => [key, flatSessionCaps[key]])
        : [];
    const serverStatusArray =
      status != null ? Object.keys(status).map((key) => [key, String(status[key])]) : [];

    // TODO: Fetch URL from Cloud Providers
    const sessionUrl = sessionId
      ? `${serverUrl}/session/${sessionId}`
      : t('Error Fetching Session URL');

    switch (name) {
      case 'Session URL':
        return sessionUrl;
      case 'Session Length':
        return time;
      case 'Server Details':
        return getTable(serverStatusArray, SESSION_INFO_TABLE_PARAMS.SERVER_KEY, false);
      case 'Session Details':
        return getTable(sessionArray, SESSION_INFO_TABLE_PARAMS.SESSION_KEY, false);
      case 'Currently Active App ID':
        return appId;
      default:
        return name;
    }
  };

  useEffect(() => {
    const {getActiveAppId, getServerStatus, getFlatSessionCaps} = props;
    const {isIOS, isAndroid} = driver.client;

    getActiveAppId(isIOS, isAndroid);
    getServerStatus();
    getFlatSessionCaps();

    interval.current = setInterval(() => {
      setTime(generateSessionTime());
    }, 1000);

    return () => clearInterval(interval.current);
  }, []);

  return getTable(sessionArray, SESSION_INFO_TABLE_PARAMS.OUTER_KEY, true);
};

export default SessionInfo;
