import {
  IconEyeCode,
  IconFileDownload,
  IconFiles,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerRecord,
  IconPlayerStop,
  IconRefresh,
  IconTrash,
} from '@tabler/icons-react';
import {Alert, Button, Card, Empty, Flex, Popconfirm, Select, Space, Table, Tabs, Tag, Tooltip, Typography} from 'antd';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';
import {Refractor} from 'react-refractor';

import {SAVED_CLIENT_FRAMEWORK} from '../../../../shared/setting-defs.js';
import {BUTTON} from '../../../constants/antd-types.js';
import {CLIENT_FRAMEWORKS} from '../../../constants/session-inspector.js';
import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import {getSetting} from '../../../polyfills.js';
import {downloadFile} from '../../../utils/file-handling.js';
import {copyToClipboard} from '../../../utils/other.js';
import {
  canDeleteRecording,
  canStartRecording,
  controlRecording,
  deleteRecording,
  describeStepTarget,
  describeStepValue,
  getRecording,
  isScoutingStep,
  listRecordings,
  originOfBuilderServer,
} from '../../../utils/server-recordings.js';

import styles from './Recordings.module.css';

const POLL_MS = 2000;

/**
 * Live / paused / finished / saved marker of a server recording.
 */
export const RecordingStatusTag = ({recording}) => {
  const {t} = useTranslation();
  if (recording.state === 'idle') {
    return <Tag>{t('notRecording')}</Tag>;
  }
  if (recording.active && recording.paused) {
    return <Tag color="orange">{t('recordingPaused')}</Tag>;
  }
  if (recording.active) {
    return (
      <Tag color="red" className={styles.liveTag}>
        <span className={styles.liveDot} />
        {t('recordingLive')}
      </Tag>
    );
  }
  return <Tag>{t('recordingFinished')}</Tag>;
};

const formatTime = (iso) => (iso ? new Date(iso).toLocaleString() : '');

/**
 * Generated test code of the selected recording, in the chosen client framework.
 */
const RecordingCode = ({recording, origin, framework, setFramework}) => {
  const {t} = useTranslation();
  const [showBoilerplate, setShowBoilerplate] = useState(false);
  const FrameworkClass = CLIENT_FRAMEWORK_MAP[framework];

  const code = useMemo(() => {
    const url = new URL(origin);
    const parts = {protocol: url.protocol.replace(':', ''), hostname: url.hostname, port: url.port, path: '/'};
    const fw = new FrameworkClass(origin, parts, recording.caps ?? {});
    fw.actions = recording.actions ?? [];
    return fw.getCodeString(showBoilerplate);
  }, [FrameworkClass, origin, recording, showBoilerplate]);

  return (
    <Flex vertical gap={8}>
      <Space>
        <Select
          value={framework}
          onChange={setFramework}
          className={styles.frameworkDropdown}
          options={Object.entries(CLIENT_FRAMEWORK_MAP).map(([id, cls]) => ({value: id, label: cls.readableName}))}
        />
        <Tooltip title={t('Show/Hide Boilerplate Code')}>
          <Button
            aria-label={t('Show/Hide Boilerplate Code')}
            icon={<IconEyeCode size={18} />}
            type={showBoilerplate ? BUTTON.PRIMARY : BUTTON.DEFAULT}
            onClick={() => setShowBoilerplate((s) => !s)}
          />
        </Tooltip>
        <Tooltip title={t('Copy code to clipboard')}>
          <Button
            aria-label={t('Copy code to clipboard')}
            icon={<IconFiles size={18} />}
            onClick={() => copyToClipboard(code)}
          />
        </Tooltip>
      </Space>
      {recording.actions?.length ? (
        <Refractor className={`refractor ${styles.code}`} language={FrameworkClass.refractorLang} value={code} />
      ) : (
        <Empty description={t('recordingHasNoSteps')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Flex>
  );
};

/**
 * Recorded steps of the selected recording, one row per step.
 */
const RecordingSteps = ({recording}) => {
  const {t} = useTranslation();
  const columns = [
    {title: '#', dataIndex: 'n', width: 50},
    {
      title: t('Action'),
      dataIndex: 'action',
      width: 90,
      render: (action, step) => (
        <Tag color={action === 'read' && !isScoutingStep(step) ? 'blue' : undefined}>
          {isScoutingStep(step) ? t('scouting') : action === 'read' ? t('verify') : action}
          {step.secret ? ' 🔒' : ''}
        </Tag>
      ),
    },
    {title: t('Target'), key: 'target', render: (_, step) => describeStepTarget(step), ellipsis: true},
    {title: t('Value'), key: 'value', render: (_, step) => describeStepValue(step), ellipsis: true},
  ];
  return (
    <Table
      size="small"
      rowKey="n"
      columns={columns}
      dataSource={recording.steps ?? []}
      pagination={false}
      scroll={{y: 360}}
    />
  );
};

/**
 * Details pane: status, actions, and the code / steps / locators.md views of one recording.
 */
/**
 * Delete button (with confirmation) for a finished recording: removes it and its saved files.
 */
export const DeleteRecordingButton = ({recording, onDelete, size, withLabel = false}) => {
  const {t} = useTranslation();
  if (!canDeleteRecording(recording)) {
    return null;
  }
  return (
    <Popconfirm
      title={t('deleteRecordingConfirmTitle')}
      description={
        <div className={styles.confirm}>
          {recording.savedTo
            ? t('deleteRecordingConfirmFolder', {folder: recording.savedTo})
            : t('deleteRecordingConfirmNoFolder')}
        </div>
      }
      okText={t('Delete')}
      okButtonProps={{danger: true}}
      cancelText={t('Cancel')}
      onConfirm={() => onDelete(recording)}
    >
      <Tooltip title={withLabel ? null : t('deleteRecording')}>
        <Button size={size} danger icon={<IconTrash size={16} />} aria-label={t('deleteRecording')}>
          {withLabel ? t('Delete') : null}
        </Button>
      </Tooltip>
    </Popconfirm>
  );
};

/**
 * Start / pause / resume / stop buttons for a recording (or a live session not recorded yet).
 */
export const RecordingControls = ({recording, control, size}) => {
  const {t} = useTranslation();
  return (
    <Space.Compact>
      {canStartRecording(recording) && (
        <Button size={size} icon={<IconPlayerRecord size={16} />} danger onClick={() => control(recording, 'start')}>
          {t('startRecording')}
        </Button>
      )}
      {recording.active && (
        <Button
          size={size}
          icon={recording.paused ? <IconPlayerPlay size={16} /> : <IconPlayerPause size={16} />}
          onClick={() => control(recording, recording.paused ? 'resume' : 'pause')}
        >
          {recording.paused ? t('resumeRecording') : t('pauseRecording')}
        </Button>
      )}
      {recording.active && (
        <Tooltip title={t('stopRecordingHint')}>
          <Button size={size} icon={<IconPlayerStop size={16} />} onClick={() => control(recording, 'stop')}>
            {t('stopRecording')}
          </Button>
        </Tooltip>
      )}
    </Space.Compact>
  );
};

const RecordingDetails = ({recording, origin, framework, setFramework, control, onDelete}) => {
  const {t} = useTranslation();
  const downloadLocators = () => {
    const href = URL.createObjectURL(new Blob([recording.locatorsMd ?? ''], {type: 'text/markdown'}));
    downloadFile(href, `locators_${recording.sessionId.slice(0, 8)}.md`);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <RecordingStatusTag recording={recording} />
          <Typography.Text code>{recording.sessionId}</Typography.Text>
        </Space>
      }
      extra={
        <Space>
          <RecordingControls recording={recording} control={control} />
          {recording.state !== 'idle' && (
            <Tooltip title={t('downloadServerLocators')}>
              <Button icon={<IconFileDownload size={18} />} onClick={downloadLocators}>
                locators.md
              </Button>
            </Tooltip>
          )}
          <DeleteRecordingButton recording={recording} onDelete={onDelete} withLabel />
        </Space>
      }
    >
      <Typography.Paragraph type="secondary" className={styles.meta}>
        {[recording.app, recording.platformName, formatTime(recording.startedAt)].filter(Boolean).join(' · ')}
        {recording.savedTo ? ` · ${recording.savedTo}` : ''}
      </Typography.Paragraph>
      {recording.state === 'idle' ? (
        <Typography.Paragraph>{t('sessionNotRecordedHint')}</Typography.Paragraph>
      ) : (
        <Tabs
          size="small"
          items={[
            {
              key: 'code',
              label: t('Generated Code'),
              children: (
                <RecordingCode
                  recording={recording}
                  origin={origin}
                  framework={framework}
                  setFramework={setFramework}
                />
              ),
            },
            {
              key: 'steps',
              label: `${t('Steps')} (${recording.steps?.length ?? 0})`,
              children: <RecordingSteps recording={recording} />,
            },
            {
              key: 'locators',
              label: 'locators.md',
              children: <pre className={styles.locators}>{recording.locatorsMd}</pre>,
            },
          ]}
        />
      )}
    </Card>
  );
};

/**
 * Session Builder tab listing what the Inspector Appium plugin recorded on the server: live sessions
 * (e.g. an AI agent driving the app through an MCP server) and saved ones, with their generated code.
 */
const Recordings = ({server}) => {
  const {t} = useTranslation();
  const origin = originOfBuilderServer(server?.remote);
  const [recordings, setRecordings] = useState([]);
  const [error, setError] = useState(null);
  // failure of a Record / Pause / Resume / Stop click, shown apart from list loading errors
  const [actionError, setActionError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  // read by the poller without restarting it on every update
  const selectedRef = useRef(null);
  const [framework, setFramework] = useState(CLIENT_FRAMEWORKS.JAVA_JUNIT4);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    void (async () => {
      const saved = await getSetting(SAVED_CLIENT_FRAMEWORK);
      if (saved && CLIENT_FRAMEWORK_MAP[saved]) {
        setFramework(saved);
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const list = await listRecordings(origin);
      setRecordings(list);
      setError(null);
      const current = list.find((r) => r.sessionId === selectedId);
      const shown = selectedRef.current;
      if (current?.state === 'idle') {
        setSelected(current); // nothing recorded yet: the list entry is all there is
      } else if (
        // refresh details while the selected recording can still change
        selectedId &&
        (!shown || shown.sessionId !== selectedId || shown.state !== current?.state || current?.active)
      ) {
        setSelected(await getRecording(origin, selectedId));
      }
    } catch (err) {
      setError(err.status === 404 ? t('recordingsApiMissing') : err.message);
    }
  }, [origin, selectedId, t]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  const removeRecording = async (rec) => {
    setActionError(null);
    try {
      await deleteRecording(origin, rec.sessionId);
      if (rec.sessionId === selectedId) {
        setSelectedId(null);
        setSelected(null);
      }
    } catch (err) {
      setActionError({action: 'delete', message: err.message});
    }
    await refresh();
  };

  const control = async (rec, action) => {
    setActionError(null);
    try {
      await controlRecording(origin, rec.sessionId, action);
    } catch (err) {
      setActionError({action, message: err.message});
    }
    await refresh();
  };

  const columns = [
    {title: t('Status'), key: 'status', width: 110, render: (_, rec) => <RecordingStatusTag recording={rec} />},
    {title: t('Started'), dataIndex: 'startedAt', width: 170, render: formatTime},
    {title: t('App'), dataIndex: 'app', ellipsis: true, render: (app, rec) => app || rec.platformName || '—'},
    {title: t('Steps'), dataIndex: 'steps', width: 70, render: (n, rec) => (rec.state === 'idle' ? '—' : n)},
    {
      key: 'controls',
      width: 200,
      render: (_, rec) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Space size={4}>
            {rec.sessionLive && <RecordingControls recording={rec} control={control} size="small" />}
            <DeleteRecordingButton recording={rec} onDelete={removeRecording} size="small" />
          </Space>
        </span>
      ),
    },
    {
      title: t('Session ID'),
      dataIndex: 'sessionId',
      width: 110,
      render: (id) => <Typography.Text code>{id.slice(0, 8)}</Typography.Text>,
    },
  ];

  return (
    <Flex vertical gap={12} className={styles.container}>
      <Flex justify="space-between" align="center">
        <Typography.Text type="secondary">{t('recordingsTabDescription', {origin})}</Typography.Text>
        <Button
          icon={<IconRefresh size={18} />}
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await refresh();
            setLoading(false);
          }}
        >
          {t('Refresh')}
        </Button>
      </Flex>
      {error && <Alert type="warning" showIcon title={t('couldNotLoadRecordings', {origin})} description={error} />}
      {actionError && (
        <Alert
          type="error"
          showIcon
          closable={{onClose: () => setActionError(null)}}
          title={t('recordingActionFailed', {action: t(`recordingAction_${actionError.action}`)})}
          description={actionError.message}
        />
      )}
      <Table
        size="small"
        rowKey="sessionId"
        columns={columns}
        dataSource={recordings}
        pagination={{pageSize: 8, hideOnSinglePage: true}}
        locale={{emptyText: <Empty description={t('noRecordingsYet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />}}
        rowClassName={(rec) => (rec.sessionId === selectedId ? styles.selectedRow : styles.row)}
        onRow={(rec) => ({
          onClick: () => {
            setSelectedId(rec.sessionId);
            setSelected(null);
          },
        })}
      />
      {selected && (
        <RecordingDetails
          recording={selected}
          origin={origin}
          framework={framework}
          setFramework={setFramework}
          control={control}
          onDelete={removeRecording}
        />
      )}
    </Flex>
  );
};

export default Recordings;
