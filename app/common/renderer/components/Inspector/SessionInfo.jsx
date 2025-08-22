import {InfoCircleOutlined} from '@ant-design/icons';
import {Card, Space, Table} from 'antd';
import _ from 'lodash';
import {useEffect, useRef, useState} from 'react';

import InspectorStyles from './Inspector.module.css';
import SessionCodeBox from './SessionCodeBox.jsx';

const SessionInfo = (props) => {
  const {driver, t} = props;

  const interval = useRef();
  const [sessionLength, setSessionLength] = useState(0);

  const formatSessionLength = () => {
    const sessionLengthDate = new Date(sessionLength);
    const hours = sessionLengthDate.getUTCHours();
    const minutes = sessionLengthDate.getUTCMinutes();
    const seconds = sessionLengthDate.getUTCSeconds();

    const padTime = (timeUnit) => String(timeUnit).padStart(2, '0');

    return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`;
  };

  const columns = [
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

  const innerDataSource = (dataObject) =>
    _.toPairs(dataObject).map(([propName, propValue]) => ({
      key: propName,
      property: propName,
      value: String(propValue),
    }));

  const getInnerTable = (dataObject) => (
    <Table
      className={InspectorStyles['session-inner-table']}
      columns={columns}
      dataSource={innerDataSource(dataObject)}
      pagination={false}
      showHeader={false}
      size="small"
      scroll={{y: 125}}
    />
  );

  const outerDataSource = () => {
    const {serverDetails, appId, status, flatSessionCaps, t} = props;
    const {sessionId} = driver || '';

    // TODO: Fetch URL from Cloud Providers
    const sessionUrl = sessionId
      ? `${serverDetails.serverUrl}/session/${sessionId}`
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
        value: formatSessionLength(),
      },
      {
        key: 'server_details',
        property: t('Server Details'),
        value: getInnerTable(status),
      },
      {
        key: 'session_details',
        property: t('Session Details'),
        value: getInnerTable(flatSessionCaps),
      },
      {
        key: 'active_appId',
        property: t('Currently Active App ID'),
        value: appId,
      },
    ];
  };

  useEffect(() => {
    const {getActiveAppId, getServerStatus, getFlatSessionCaps, sessionStartTime} = props;
    const {isIOS, isAndroid} = driver;

    getActiveAppId(isIOS, isAndroid);
    getServerStatus();
    getFlatSessionCaps();

    interval.current = setInterval(() => {
      setSessionLength(Date.now() - sessionStartTime);
    }, 1000);

    return () => clearInterval(interval.current);
  }, []);

  return (
    <Card
      title={
        <span>
          <InfoCircleOutlined /> {t('Session Information')}
        </span>
      }
      className={InspectorStyles['interaction-tab-card']}
    >
      <Space direction="vertical" size="middle">
        <Table
          columns={columns}
          dataSource={outerDataSource()}
          pagination={false}
          showHeader={false}
          bordered={true}
          size="small"
        />
        <SessionCodeBox {...props} />
      </Space>
    </Card>
  );
};

export default SessionInfo;
