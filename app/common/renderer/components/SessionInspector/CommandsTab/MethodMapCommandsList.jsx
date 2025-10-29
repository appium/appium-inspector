import {SearchOutlined} from '@ant-design/icons';
import {Button, Col, Input, Row, Space, Tabs, Tooltip} from 'antd';
import _ from 'lodash';
import {useState} from 'react';

import {transformMethodMap} from '../../../utils/commands-tab.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';

const renderCommandTooltipText = (methodDetails, t) => {
  if (!methodDetails.deprecated && !methodDetails.info) {
    return null;
  }
  return (
    <>
      {methodDetails.deprecated && <div>{t('methodDeprecated')}</div>}
      {methodDetails.info && <div>{methodDetails.info}</div>}
    </>
  );
};

// Dynamic list of driver commands, generated from the driver's method map responses
const MethodMapCommandsList = (props) => {
  const {driverCommands, driverExecuteMethods, startCommand, t} = props;

  const [searchQuery, setSearchQuery] = useState('');

  const hasNoCommands = _.isEmpty(driverCommands);
  const hasNoExecuteMethods = _.isEmpty(driverExecuteMethods);

  const MethodMapButtonsGrid = ({driverMethods, isExecute}) => (
    <Row>
      {transformMethodMap(driverMethods, searchQuery).map(([methodName, methodDetails], index) => (
        <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
          <div className={styles.btnContainer}>
            <Tooltip title={renderCommandTooltipText(methodDetails, t)}>
              <Button
                className={methodDetails.deprecated ? styles.deprecatedMethod : ''}
                onClick={() => startCommand({name: methodName, details: methodDetails, isExecute})}
              >
                {methodName}
              </Button>
            </Tooltip>
          </div>
        </Col>
      ))}
    </Row>
  );

  const CommandsButtonGrid = () => (
    <Space className={inspectorStyles.spaceContainer} direction="vertical" size="middle">
      {t('dynamicCommandsDescription')}
      <MethodMapButtonsGrid driverMethods={driverCommands} isExecute={false} />
    </Space>
  );

  const ExecuteMethodsButtonGrid = () => (
    <Space className={inspectorStyles.spaceContainer} direction="vertical" size="middle">
      {t('dynamicExecuteMethodsDescription')}
      <MethodMapButtonsGrid driverMethods={driverExecuteMethods} isExecute={true} />
    </Space>
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
          children: <CommandsButtonGrid />,
        },
        {
          label: t('executeMethods'),
          key: '2',
          disabled: hasNoExecuteMethods,
          children: <ExecuteMethodsButtonGrid />,
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
