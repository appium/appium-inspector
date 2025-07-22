import {DeleteOutlined, EditOutlined} from '@ant-design/icons';
import {Button, Card, Popconfirm, Space, Splitter, Table, Tooltip} from 'antd';
import moment from 'moment';

import {SAVED_SESSIONS_TABLE_VALUES, SESSION_BUILDER_TABS} from '../../constants/session-builder';
import FormattedCaps from './FormattedCaps.jsx';
import SessionStyles from './Session.module.css';

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
  const {savedSessions, deleteSavedSession, capsUUID, switchTabs, t} = props;

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
        <Space.Compact>
          <Tooltip zIndex={3} title={t('Edit')}>
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                handleCapsAndServer(record.key);
                switchTabs(SESSION_BUILDER_TABS.CAPS_BUILDER);
              }}
            />
          </Tooltip>
          <Tooltip zIndex={3} title={t('Delete')}>
            <Popconfirm
              zIndex={4}
              title={t('confirmDeletion')}
              okText={t('OK')}
              cancelText={t('Cancel')}
              onConfirm={() => deleteSavedSession(record.key)}
            >
              <Button icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space.Compact>
      ),
    },
  ];

  return (
    <Splitter>
      <Splitter.Panel min={430}>
        <Card className={SessionStyles.savedSessions}>
          <Table
            pagination={false}
            sticky={true}
            dataSource={dataSource(savedSessions, t)}
            columns={columns}
            onRow={(row) => ({onClick: () => handleCapsAndServer(row.key)})}
            rowSelection={{
              selectedRowKeys: [capsUUID],
              hideSelectAll: true,
              columnWidth: 0,
              renderCell: () => null,
            }}
          />
        </Card>
      </Splitter.Panel>
      <Splitter.Panel collapsible min={400}>
        <FormattedCaps
          {...props}
          title={capsUUID ? getSessionById(savedSessions, capsUUID, t).name : null}
        />
      </Splitter.Panel>
    </Splitter>
  );
};

export default SavedSessions;
