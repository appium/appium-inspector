import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {Button, Col, Row, Table} from 'antd';
import moment from 'moment';
import React from 'react';

import FormattedCaps from './FormattedCaps';
import SessionStyles from './Session.css';

const DATE_COLUMN_WIDTH = '25%';
const ACTIONS_COLUMN_WIDTH = '106px';

const dataSource = (savedSessions) => {
  if (!savedSessions) {
    return [];
  }
  return savedSessions.map((session) => ({
    key: session.uuid,
    name: session.name || '(Unnamed)',
    date: moment(session.date).format('YYYY-MM-DD'),
  }));
};

const sessionFromUUID = (savedSessions, uuid) => {
  for (let session of savedSessions) {
    if (session.uuid === uuid) {
      return session;
    }
  }
  throw new Error(`Couldn't find session with uuid ${uuid}`);
};

const SavedSessions = (props) => {
  const {savedSessions, capsUUID, switchTabs} = props;

  const handleCapsAndServer = (uuid) => {
    const {
      setCapsAndServer,
      server,
      serverType,
      isEditingDesiredCapsName,
      abortDesiredCapsNameEditor,
      isEditingDesiredCaps,
      abortDesiredCapsEditor,
    } = props;
    const session = sessionFromUUID(savedSessions, uuid);

    // Disable any editors before changing the selected caps
    if (isEditingDesiredCapsName) {
      abortDesiredCapsNameEditor();
    }
    if (isEditingDesiredCaps) {
      abortDesiredCapsEditor();
    }

    // In case user has CAPS saved from older version of Inspector which
    // doesn't contain server and serverType within the session object
    setCapsAndServer(
      session.server || server,
      session.serverType || serverType,
      session.caps,
      session.uuid,
      session.name,
    );
  };

  const handleDelete = (uuid) => {
    const {deleteSavedSession} = props;
    if (window.confirm('Are you sure?')) {
      deleteSavedSession(uuid);
    }
  };

  const columns = [
    {
      title: 'Capability Set',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Created',
      dataIndex: 'date',
      key: 'date',
      width: DATE_COLUMN_WIDTH,
    },
    {
      title: 'Actions',
      key: 'action',
      width: ACTIONS_COLUMN_WIDTH,
      render: (_, record) => (
        <div>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              handleCapsAndServer(record.key);
              switchTabs('new');
            }}
            className={SessionStyles.editSession}
          />
          <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record.key)} />
        </div>
      ),
    },
  ];

  return (
    <Row className={SessionStyles.savedSessions}>
      <Col span={12}>
        <Table
          pagination={false}
          sticky={true}
          dataSource={dataSource(savedSessions)}
          columns={columns}
          onRow={(row) => ({onClick: () => handleCapsAndServer(row.key)})}
          rowClassName={(row) => (capsUUID === row.key ? SessionStyles.selected : '')}
        />
      </Col>
      <Col span={12} className={SessionStyles.capsFormattedCol}>
        <FormattedCaps
          {...props}
          title={capsUUID ? sessionFromUUID(savedSessions, capsUUID).name : null}
        />
      </Col>
    </Row>
  );
};

export default SavedSessions;
