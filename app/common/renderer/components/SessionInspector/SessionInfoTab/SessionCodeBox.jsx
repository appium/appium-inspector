import {IconCode, IconFiles} from '@tabler/icons-react';
import {Button, Card, Flex, Select, Space, Tooltip} from 'antd';
import _ from 'lodash';
import {useTranslation} from 'react-i18next';
import {Refractor} from 'react-refractor';

import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import {copyToClipboard} from '../../../utils/other.js';
import inspectorStyles from '../SessionInspector.module.css';

const SessionCodeBox = (props) => {
  const {clientFramework, setClientFramework} = props;
  const {t} = useTranslation();

  const ClientFrameworkClass = CLIENT_FRAMEWORK_MAP[clientFramework];

  const getCode = () => {
    const {serverDetails, sessionCaps} = props;
    const {serverUrl, serverUrlParts} = serverDetails;

    const framework = new ClientFrameworkClass(serverUrl, serverUrlParts, sessionCaps);
    return framework.getCodeString(true);
  };

  const actionBar = () => (
    <Space size="middle">
      <Tooltip title={t('Copy code to clipboard')}>
        <Button icon={<IconFiles size={18} />} onClick={() => copyToClipboard(getCode())} />
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

  return (
    <Card
      title={
        <Flex gap={4} align="center">
          <IconCode size={18} />
          {t('Start this Kind of Session with Code')}
        </Flex>
      }
      extra={actionBar()}
    >
      <Refractor language={ClientFrameworkClass.refractorLang} value={getCode()} />
    </Card>
  );
};

export default SessionCodeBox;
