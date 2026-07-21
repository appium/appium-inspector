import {IconSearch} from '@tabler/icons-react';
import {Input, Tabs} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {filterMethodPairs} from '../../../utils/commands-tab.js';
import {isEmpty} from '../../../utils/lang.js';
import styles from './Commands.module.css';
import MethodMapCommandsContent from './MethodMapCommandsContent.jsx';

/**
 * Tab switcher for the dynamic list of driver commands and execute methods.
 */
const MethodMapCommandsTabs = ({driverCommands, driverExecuteMethods, startCommand}) => {
  const {t} = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');

  const hasNoCommands = isEmpty(driverCommands);
  const hasNoExecuteMethods = isEmpty(driverExecuteMethods);

  const filteredDriverCommands = filterMethodPairs(driverCommands, searchQuery);
  const filteredDriverExecuteMethods = filterMethodPairs(driverExecuteMethods, searchQuery);

  return (
    <Tabs
      defaultActiveKey={hasNoCommands ? '2' : '1'}
      size="small"
      centered
      items={[
        {
          label: t('Commands'),
          key: '1',
          disabled: hasNoCommands,
          className: styles.methodMapTab,
          children: (
            <MethodMapCommandsContent
              driverMethods={filteredDriverCommands}
              isExecute={false}
              startCommand={startCommand}
            />
          ),
        },
        {
          label: t('executeMethods'),
          key: '2',
          disabled: hasNoExecuteMethods,
          className: styles.methodMapTab,
          children: (
            <MethodMapCommandsContent
              driverMethods={filteredDriverExecuteMethods}
              isExecute={true}
              startCommand={startCommand}
            />
          ),
        },
      ]}
      tabBarExtraContent={
        <Input
          placeholder={t('Search')}
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
          allowClear
          prefix={<IconSearch size={12} />}
        />
      }
    />
  );
};

export default MethodMapCommandsTabs;
