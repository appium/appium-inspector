import {Table} from 'antd';
import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import inspectorStyles from '../SessionInspector.module.css';
import styles from './SessionInfo.module.css';

const formatMono = (node) => <span className={inspectorStyles.monoFont}>{node}</span>;

const formatSessionLength = (sessionLength) => {
  const sessionLengthDate = new Date(sessionLength);
  const hours = sessionLengthDate.getUTCHours();
  const minutes = sessionLengthDate.getUTCMinutes();
  const seconds = sessionLengthDate.getUTCSeconds();

  const padTime = (timeUnit) => String(timeUnit).padStart(2, '0');

  return formatMono(`${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`);
};

const tableColumns = [
  {
    dataIndex: 'property',
    key: 'property',
    width: 200,
  },
  {
    dataIndex: 'value',
    key: 'value',
  },
];

const innerDataSource = (tableData) =>
  Object.entries(tableData).map(([propName, propValue]) => ({
    key: propName,
    property: formatMono(propName),
    value: formatMono(String(propValue)),
  }));

/**
 * Inner table component for session information cells with multiple values.
 */
const SessionInfoInnerTable = ({tableData}) => (
  <Table
    className={styles.sessionInnerTable}
    columns={tableColumns}
    dataSource={innerDataSource(tableData)}
    pagination={false}
    showHeader={false}
    size="small"
    scroll={{y: 125}}
  />
);

/**
 * Main table containing session information details.
 */
const SessionInfoTable = (props) => {
  const {
    driver,
    getActiveAppId,
    getServerStatus,
    getFlatSessionCaps,
    sessionStartTime,
    serverDetails,
    appId,
    status,
    flatSessionCaps,
  } = props;
  const {t} = useTranslation();

  const intervalRef = useRef(null);
  const [sessionLength, setSessionLength] = useState(0);

  const outerDataSource = () => {
    const {sessionId} = driver ?? {};

    // TODO: Fetch URL from Cloud Providers
    const sessionUrl = sessionId
      ? formatMono(`${serverDetails.serverUrl}/session/${sessionId}`)
      : t('Error Fetching Session URL');

    return [
      {
        key: 'session_url',
        property: t('Session URL'),
        value: sessionUrl,
      },
      {
        key: 'session_length',
        property: t('Session Length'),
        value: formatSessionLength(sessionLength),
      },
      {
        key: 'server_details',
        property: t('Server Details'),
        value: <SessionInfoInnerTable tableData={status} />,
      },
      {
        key: 'session_details',
        property: t('Session Details'),
        value: <SessionInfoInnerTable tableData={flatSessionCaps} />,
      },
      {
        key: 'active_appId',
        property: t('Currently Active App ID'),
        value: formatMono(appId),
      },
    ];
  };

  useEffect(() => {
    if (!driver) {
      return;
    }
    const {isIOS, isAndroid} = driver;
    getActiveAppId(isIOS, isAndroid);
    getServerStatus();
    getFlatSessionCaps();

    intervalRef.current = setInterval(() => {
      setSessionLength(Date.now() - sessionStartTime);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [driver, getActiveAppId, getServerStatus, getFlatSessionCaps, sessionStartTime]);

  return (
    <Table
      columns={tableColumns}
      dataSource={outerDataSource()}
      pagination={false}
      showHeader={false}
      bordered={true}
      size="small"
    />
  );
};

export default SessionInfoTable;
