import {SearchOutlined} from '@ant-design/icons';
import {Button, Divider, Grid, Input, Table, Tabs, Tooltip} from 'antd';
import _ from 'lodash';
import {useMemo, useState} from 'react';

import {transformMethodMap} from '../../../utils/commands-tab.js';
import styles from './Commands.module.css';

const getGridColumnCount = (screens) => {
  if (screens.xxl) {
    return 6;
  }
  if (screens.xl) {
    return 4;
  }
  if (screens.lg) {
    return 3;
  }
  return 2;
};

const groupMethodsIntoRows = (driverMethods, colCount) => {
  const groups = [];
  for (let i = 0; i < driverMethods.length; i += colCount) {
    groups.push({
      key: `row-${i}`,
      methods: driverMethods.slice(i, i + colCount),
    });
  }
  return groups;
};

// Dynamic list of driver commands, generated from the driver's method map responses.
// Unlike StaticCommandsList, we want to show a single grid of all methods.
// However, antd has performance issues when rendering 100+ items under one parent
// (https://github.com/ant-design/ant-design/issues/44039),
// so use approaches like useMemo and manual column/row assembly
// for a responsive design
const MethodMapCommandsList = (props) => {
  const {driverCommands, driverExecuteMethods, startCommand, t} = props;

  // Group methods into rows for better rendering performance
  const screens = Grid.useBreakpoint();
  const columnCount = useMemo(() => getGridColumnCount(screens), [screens]);

  const [searchQuery, setSearchQuery] = useState('');

  const hasNoCommands = _.isEmpty(driverCommands);
  const hasNoExecuteMethods = _.isEmpty(driverExecuteMethods);

  const filteredDriverCommands = useMemo(
    () => transformMethodMap(driverCommands, searchQuery),
    [driverCommands, searchQuery],
  );
  const filteredDriverExecuteMethods = useMemo(
    () => transformMethodMap(driverExecuteMethods, searchQuery),
    [driverExecuteMethods, searchQuery],
  );

  const MethodButton = ({methodName, methodDetails, isExecute}) => (
    <div className={styles.btnContainer}>
      {!methodDetails.deprecated && !methodDetails.info && (
        <Button onClick={() => startCommand({name: methodName, details: methodDetails, isExecute})}>
          {methodName}
        </Button>
      )}
      {(methodDetails.deprecated || methodDetails.info) && (
        <Tooltip
          title={
            <>
              {methodDetails.deprecated && <div>{t('methodDeprecated')}</div>}
              {methodDetails.info && <div>{methodDetails.info}</div>}
            </>
          }
          destroyOnHidden={true}
        >
          <Button
            className={styles.deprecatedMethod}
            onClick={() => startCommand({name: methodName, details: methodDetails, isExecute})}
          >
            {methodName}
          </Button>
        </Tooltip>
      )}
    </div>
  );

  const MethodMapButtonsGrid = ({driverMethods, isExecute}) => {
    const tableDataSource = useMemo(
      () => groupMethodsIntoRows(driverMethods, columnCount),
      [driverMethods],
    );

    const columns = Array.from({length: columnCount}, (_, index) => ({
      key: `col-${index}`,
      render: (row) => {
        // last row will likely have fewer items than columnCount
        const methodEntry = row.methods[index];
        if (!methodEntry) {
          return null;
        }
        const [methodName, methodDetails] = methodEntry;
        return (
          <MethodButton
            methodName={methodName}
            methodDetails={methodDetails}
            isExecute={isExecute}
          />
        );
      },
    }));

    return (
      <div className={styles.methodMapTable}>
        <Table
          dataSource={tableDataSource}
          columns={columns}
          pagination={false}
          showHeader={false}
          rowHoverable={false}
          size="small"
        />
      </div>
    );
  };

  const MethodMapTabContent = ({driverMethods, isExecute}) => (
    <>
      {isExecute ? t('dynamicExecuteMethodsDescription') : t('dynamicCommandsDescription')}
      <Divider size="middle" />
      <MethodMapButtonsGrid driverMethods={driverMethods} isExecute={isExecute} />
    </>
  );

  return (
    <Tabs
      className={styles.methodMapTabs}
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
            <MethodMapTabContent driverMethods={filteredDriverCommands} isExecute={false} />
          ),
        },
        {
          label: t('executeMethods'),
          key: '2',
          disabled: hasNoExecuteMethods,
          className: styles.methodMapTab,
          children: (
            <MethodMapTabContent driverMethods={filteredDriverExecuteMethods} isExecute={true} />
          ),
        },
      ]}
      tabBarExtraContent={
        <Input
          placeholder={t('Search')}
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
          allowClear
          prefix={<SearchOutlined />}
        />
      }
    />
  );
};

export default MethodMapCommandsList;
