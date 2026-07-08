import {IconCode, IconFiles} from '@tabler/icons-react';
import {Button, Card, Flex, Select, Space, Tooltip} from 'antd';
import _ from 'lodash';
import {useTranslation} from 'react-i18next';

import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import {copyToClipboard} from '../../../utils/other.js';
import inspectorStyles from '../SessionInspector.module.css';

/**
 * Title of the session information code box card.
 */
const SessionCodeBoxPanelTitle = () => {
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
const SessionCodeBoxHeaderOptions = ({clientCode, clientFramework, setClientFramework}) => {
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
        options={_.map(CLIENT_FRAMEWORK_MAP, (fwClass, fwId) => ({
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
const SessionCodeBoxCard = ({clientCode, clientFramework, setClientFramework, children}) => (
  <Card
    title={<SessionCodeBoxPanelTitle />}
    extra={
      <SessionCodeBoxHeaderOptions
        clientCode={clientCode}
        clientFramework={clientFramework}
        setClientFramework={setClientFramework}
      />
    }
  >
    {children}
  </Card>
);

export default SessionCodeBoxCard;
