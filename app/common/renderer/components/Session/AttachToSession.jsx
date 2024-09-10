import {ReloadOutlined} from '@ant-design/icons';
import {Button, Card, Col, Form, Row, Select, Tooltip} from 'antd';

import {getSessionInfo} from '../../utils/attaching-to-session';
import SessionStyles from './Session.module.css';

const AttachToSession = ({
  serverType,
  attachSessId,
  setAttachSessId,
  runningAppiumSessions,
  getRunningSessions,
  t,
}) => (
  <Form>
    <Form.Item>
      <Card>
        <p className={SessionStyles.localDesc}>
          {t('connectToExistingSessionInstructions')}
          <br />
          {t('selectSessionIDInDropdown')}
        </p>
      </Card>
    </Form.Item>
    <Form.Item>
      <Row>
        <Col span={23}>
          <Select
            showSearch
            notFoundContent={t('noResultsFound')}
            placeholder={t('enterYourSessionId')}
            value={attachSessId || undefined}
            onChange={(value) => setAttachSessId(value)}
          >
            {runningAppiumSessions
              .slice()
              .reverse()
              .map((session) => (
                // list is reversed in order to place the most recent sessions at the top
                // slice() is added because reverse() mutates the original array
                <Select.Option key={session.id} value={session.id}>
                  <div>{getSessionInfo(session, serverType)}</div>
                </Select.Option>
              ))}
          </Select>
        </Col>
        <Col span={1}>
          <Tooltip title={t('Reload')}>
            <Button
              className={SessionStyles.btnReload}
              onClick={getRunningSessions}
              icon={<ReloadOutlined />}
            />
          </Tooltip>
        </Col>
      </Row>
    </Form.Item>
  </Form>
);

export default AttachToSession;
