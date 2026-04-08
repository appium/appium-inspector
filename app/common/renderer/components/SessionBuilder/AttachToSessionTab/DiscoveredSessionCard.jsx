import {
  IconApps,
  IconClockHour4,
  IconDeviceMobile,
  IconDeviceMobileCog,
  IconLinkPlus,
  IconTag,
} from '@tabler/icons-react';
import {Button, Card, Col, Flex, Row, Space, Typography} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {getSessionInfo} from '../../../utils/attaching-to-session.js';
import styles from './AttachToSession.module.css';

const addIcon = (Icon, label) => (
  <Flex gap={4} align="center">
    <Icon size={18} />
    <Typography.Text ellipsis={true}>{label}</Typography.Text>
  </Flex>
);

/**
 * Card for a single discovered session.
 */
const DiscoveredSessionCard = ({session, serverType, loadNewSession}) => {
  const {t} = useTranslation();
  const sessionDetails = getSessionInfo(session, serverType);

  return (
    <Card hoverable={true} styles={{root: {height: '100%'}, body: {padding: '8px'}}}>
      <Space className={styles.spaceContainer} orientation="vertical" size="small">
        <Row justify="space-between" align="middle">
          <Typography.Text code ellipsis={true}>
            {sessionDetails.id}
          </Typography.Text>
          <Button
            type={BUTTON.PRIMARY}
            icon={<IconLinkPlus size={18} />}
            onClick={() => loadNewSession(null, sessionDetails.id)}
          >
            {t('Attach')}
          </Button>
        </Row>
        {sessionDetails.sessionName && <Row>{addIcon(IconTag, sessionDetails.sessionName)}</Row>}
        <Row>
          {sessionDetails.deviceId && (
            <Col span={12}>{addIcon(IconDeviceMobile, sessionDetails.deviceId)}</Col>
          )}
          <Col span={12}>{addIcon(IconDeviceMobileCog, sessionDetails.platformInfo)}</Col>
        </Row>
        <Row>
          {sessionDetails.appId && <Col span={12}>{addIcon(IconApps, sessionDetails.appId)}</Col>}
          {sessionDetails.timestamp && (
            <Col span={12}>{addIcon(IconClockHour4, sessionDetails.timestamp)}</Col>
          )}
        </Row>
      </Space>
    </Card>
  );
};

export default DiscoveredSessionCard;
