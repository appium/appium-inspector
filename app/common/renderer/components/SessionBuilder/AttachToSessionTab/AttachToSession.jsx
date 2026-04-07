import {IconLinkPlus, IconRefresh} from '@tabler/icons-react';
import {Button, Card, Col, Empty, Form, Input, Row, Select, Spin, Tooltip} from 'antd';
import _ from 'lodash';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {getSessionInfo} from '../../../utils/attaching-to-session.js';
import builderStyles from '../SessionBuilder.module.css';
import styles from './AttachToSession.module.css';

const AttachToSession = ({
  serverType,
  attachSessId,
  setAttachSessId,
  runningAppiumSessions,
  gettingSessions,
  getRunningSessions,
  loadNewSession,
}) => {
  const {t} = useTranslation();
  const debouncedSetAttachSessId = useRef(
    _.debounce((value) => setAttachSessId(value), 200),
  ).current;

  // list is reversed in order to place the most recent sessions at the top
  // slice() is added because reverse() mutates the original array
  const sortedRunningSessions = runningAppiumSessions
    .slice()
    .reverse()
    .map((session) => ({value: session.id, label: getSessionInfo(session, serverType)}));

  return (
    <Form>
      <Form.Item>
        <Card>
          <p className={builderStyles.localDesc}>
            {t('connectToExistingSessionInstructions')}
            <br />
            {t('selectSessionID')}
          </p>
        </Card>
      </Form.Item>
      <Form.Item>
        <Row gutter={8}>
          <Col span={8} offset={6}>
            <Input
              placeholder={t('enterSessionID')}
              allowClear={true}
              onChange={(e) => debouncedSetAttachSessId(e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Button
              type={BUTTON.PRIMARY}
              disabled={!attachSessId}
              onClick={() => loadNewSession(null, attachSessId)}
              icon={<IconLinkPlus size={18} />}
            >
              {t('attachToSession')}
            </Button>
          </Col>
        </Row>
      </Form.Item>
      <Spin spinning={gettingSessions}>
        {sortedRunningSessions.length !== 0 ? (
          <Form.Item>
            <Row>
              <Col span={23}>
                <Select
                  showSearch
                  placeholder={t('searchSessions')}
                  value={attachSessId || undefined}
                  onChange={(value) => setAttachSessId(value)}
                  options={sortedRunningSessions}
                />
              </Col>
              <Col span={1}>
                <Tooltip title={t('Reload')}>
                  <Button
                    className={styles.btnReload}
                    onClick={getRunningSessions}
                    icon={<IconRefresh size={18} />}
                  />
                </Tooltip>
              </Col>
            </Row>
          </Form.Item>
        ) : (
          <Empty description={t('noRunningSessionsFound')} image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button onClick={getRunningSessions} icon={<IconRefresh size={18} />}>
              {t('Reload')}
            </Button>
          </Empty>
        )}
      </Spin>
    </Form>
  );
};

export default AttachToSession;
