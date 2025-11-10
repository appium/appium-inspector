import {SearchOutlined} from '@ant-design/icons';
import {Button, Col, Divider, Input, Row, Tabs, Tooltip} from 'antd';
import _ from 'lodash';
import {useState} from 'react';

import {filterMethodPairs} from '../../../utils/commands-tab.js';
import styles from './Commands.module.css';

// Dynamic list of driver commands, generated from the driver's method map responses.
// Unlike StaticCommandsList, we cannot predict the contents of the method map response,
// and we also want to be able to filter it, so just render all methods in a single grid.
const MethodMapCommandsList = (props) => {
  const {driverCommands, driverExecuteMethods, startCommand, t} = props;

  const [searchQuery, setSearchQuery] = useState('');

  const hasNoCommands = _.isEmpty(driverCommands.current);
  const hasNoExecuteMethods = _.isEmpty(driverExecuteMethods.current);

  const filteredDriverCommands = filterMethodPairs(driverCommands.current, searchQuery);
  const filteredDriverExecuteMethods = filterMethodPairs(driverExecuteMethods.current, searchQuery);

  const methodButton = (methodName, methodDetails, isExecute) => (
    <div className={styles.btnContainer}>
      {!methodDetails.deprecated && !methodDetails.info && (
        <Button
          className={styles.methodBtn}
          onClick={() => startCommand({name: methodName, details: methodDetails, isExecute})}
        >
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
            className={`${styles.methodBtn} ${styles.deprecatedMethod}`}
            onClick={() => startCommand({name: methodName, details: methodDetails, isExecute})}
          >
            {methodName}
          </Button>
        </Tooltip>
      )}
    </div>
  );

  const methodMapContent = (driverMethods, isExecute) => (
    <>
      {isExecute ? t('dynamicExecuteMethodsDescription') : t('dynamicCommandsDescription')}
      <Divider size="middle" />
      <div className={styles.methodMapGrid}>
        <Row>
          {driverMethods.map(([methodName, methodDetails]) => (
            <Col key={methodName} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
              {methodButton(methodName, methodDetails, isExecute)}
            </Col>
          ))}
        </Row>
      </div>
    </>
  );

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
          children: methodMapContent(filteredDriverCommands, false),
        },
        {
          label: t('executeMethods'),
          key: '2',
          disabled: hasNoExecuteMethods,
          className: styles.methodMapTab,
          children: methodMapContent(filteredDriverExecuteMethods, true),
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
