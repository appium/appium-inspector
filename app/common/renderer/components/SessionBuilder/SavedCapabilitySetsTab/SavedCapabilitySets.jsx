import {DeleteOutlined, EditOutlined, ExportOutlined} from '@ant-design/icons';
import {Button, Card, Popconfirm, Space, Spin, Splitter, Table, Tooltip} from 'antd';
import dayjs from 'dayjs';

import {
  SAVED_SESSIONS_TABLE_VALUES,
  SESSION_BUILDER_TABS,
  SESSION_FILE_EXTENSION,
} from '../../../constants/session-builder.js';
import FileUploader from '../../FileUploader.jsx';
import CapabilityJSON from '../CapabilityJSON/CapabilityJSON.jsx';
import styles from './SavedCapabilitySets.module.css';

const dataSource = (savedSessions, t) => {
  if (!savedSessions) {
    return [];
  }
  return savedSessions.map((session) => ({
    key: session.uuid,
    name: session.name || t('unnamed'),
    date: dayjs(session.date).format('YYYY-MM-DD'),
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

const SavedCapabilitySets = (props) => {
  const {
    savedSessions,
    exportSavedSession,
    deleteSavedSession,
    capsUUID,
    switchTabs,
    importSessionFiles,
    isUploadingSessionFiles,
    t,
  } = props;

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

  const findAndExportSavedSession = (uuid) => {
    const session = getSessionById(savedSessions, uuid, t);
    exportSavedSession(session);
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
          <Tooltip zIndex={3} title={t('Export to File')}>
            <Button
              icon={<ExportOutlined />}
              onClick={() => findAndExportSavedSession(record.key)}
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
        <Spin spinning={isUploadingSessionFiles}>
          <Card styles={{root: {height: '100%'}, body: {height: '100%', padding: '2px'}}}>
            <Table
              className={styles.capabilitySetsTable}
              styles={{
                root: {height: '100%'},
                header: {cell: {padding: '8px 16px'}},
                section: {height: 'calc(100% - 48px)'},
                body: {cell: {padding: '8px 16px'}},
                footer: {padding: '8px 16px'},
              }}
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
              scroll={{y: 'calc(100% - 37px)'}}
              footer={() => (
                <FileUploader
                  title={t('Import from File')}
                  onUpload={importSessionFiles}
                  multiple={true}
                  type={SESSION_FILE_EXTENSION}
                />
              )}
            />
          </Card>
        </Spin>
      </Splitter.Panel>
      <Splitter.Panel collapsible min={400}>
        <CapabilityJSON
          {...props}
          title={capsUUID ? getSessionById(savedSessions, capsUUID, t).name : null}
        />
      </Splitter.Panel>
    </Splitter>
  );
};

export default SavedCapabilitySets;
