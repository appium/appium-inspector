import {IconCode, IconFiles} from '@tabler/icons-react';
import {Button, Card, Flex, Select, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import {copyToClipboard} from '../../../utils/other.js';
import inspectorStyles from '../SessionInspector.module.css';

/**
 * Title of the session information code box card.
 */
const SessionInfoCodeBoxPanelTitle = () => {
  const {t} = useTranslation();

  return (
    <Flex gap={4} align="center">
      <IconCode size={18} />
      {t('Start this Kind of Session with Code')}
    </Flex>
  );
};

/**
 * Options shown in the session information code box card header.
 */
const SessionInfoCodeBoxHeaderOptions = ({clientCode, clientFramework, setClientFramework}) => {
  const {t} = useTranslation();

  return (
    <Space size="middle">
      <Tooltip title={t('Copy code to clipboard')}>
        <Button icon={<IconFiles size={18} />} onClick={() => copyToClipboard(clientCode)} />
      </Tooltip>
      <Select
        defaultValue={clientFramework}
        value={clientFramework}
        onChange={setClientFramework}
        className={inspectorStyles.frameworkDropdown}
        options={Object.entries(CLIENT_FRAMEWORK_MAP).map(([fwId, fwClass]) => ({
          value: fwId,
          label: fwClass.readableName,
        }))}
      />
    </Space>
  );
};

/**
 * Wrapper card for the session information code box.
 */
const SessionInfoCodeBoxCard = ({clientCode, clientFramework, setClientFramework, children}) => (
  <Card
    title={<SessionInfoCodeBoxPanelTitle />}
    extra={
      <SessionInfoCodeBoxHeaderOptions
        clientCode={clientCode}
        clientFramework={clientFramework}
        setClientFramework={setClientFramework}
      />
    }
  >
    {children}
  </Card>
);

export default SessionInfoCodeBoxCard;
