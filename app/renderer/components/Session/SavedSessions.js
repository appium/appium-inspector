import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {Button, Col, Row, Table} from 'antd';
import moment from 'moment';
import React from 'react';

import {SAVED_SESSIONS_TABLE_VALUES} from '../../constants/session-builder';
import FormattedCaps from './FormattedCaps';
import SessionStyles from './Session.css';

const dataSource = (savedSessions, t) => {
  if (!savedSessions) {
    return [];
  }
  return savedSessions.map((session) => ({
    key: session.uuid,
    name: session.name || t('unnamed'),
    date: moment(session.date).format('YYYY-MM-DD'),
  }));
};

const getSessionById = (savedSessions, id, t) => {
  for (let session of savedSessions) {
    if (session.uuid === id) {
      return session;
    }
  }
  throw new Error(t('couldNotFindEntryWithId', {id}));
};

const SavedSessions = (props) => {
  const {savedSessions, capsUUID, switchTabs, t} = props;

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
    const session = getSessionById(savedSessions, uuid, t);

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
    if (window.confirm(t('confirmDeletion'))) {
      deleteSavedSession(uuid);
    }
  };

  const columns = [
    {
      title: t('Name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('Created'),
      dataIndex: 'date',
      key: 'date',
      width: SAVED_SESSIONS_TABLE_VALUES.DATE_COLUMN_WIDTH,
    },
    {
      title: t('Actions'),
      key: 'action',
      width: SAVED_SESSIONS_TABLE_VALUES.ACTIONS_COLUMN_WIDTH,
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
          dataSource={dataSource(savedSessions, t)}
          columns={columns}
          onRow={(row) => ({onClick: () => handleCapsAndServer(row.key)})}
          rowClassName={(row) => (capsUUID === row.key ? SessionStyles.selected : '')}
        />
      </Col>
      <Col span={12} className={SessionStyles.capsFormattedCol}>
        <FormattedCaps
          {...props}
          title={capsUUID ? getSessionById(savedSessions, capsUUID, t).name : null}
        />
      </Col>
    </Row>
  );
};

export default SavedSessions;
