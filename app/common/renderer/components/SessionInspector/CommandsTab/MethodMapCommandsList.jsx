import {Button, Col, Collapse, Row, Space, Tabs, Tooltip} from 'antd';
import _ from 'lodash';

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

const MethodMapButtonsGrid = ({driverCommands, startCommand, isExecute, t}) => {
  const InnerGrid = ({methodMap}) => (
    <Row>
      {_.toPairs(methodMap).map(([methodName, methodDetails], index) => (
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

  return _.size(driverCommands) === 1 ? (
    <InnerGrid methodMap={Object.values(driverCommands)[0]} />
  ) : (
    <Collapse
      items={_.toPairs(driverCommands).map(([methodSource, methodMap]) => ({
        key: methodSource,
        label: _.capitalize(methodSource),
        children: <InnerGrid methodMap={methodMap} />,
      }))}
    />
  );
};

const CommandsButtonGrid = ({driverCommands, startCommand, t}) => (
  <Space className={inspectorStyles.spaceContainer} direction="vertical" size="middle">
    {t('dynamicCommandsDescription')}
    <MethodMapButtonsGrid
      driverCommands={driverCommands}
      startCommand={startCommand}
      isExecute={false}
      t={t}
    />
  </Space>
);

const ExecuteMethodsButtonGrid = ({executeMethods, startCommand, t}) => (
  <Space className={inspectorStyles.spaceContainer} direction="vertical" size="middle">
    {t('dynamicExecuteMethodsDescription')}
    <MethodMapButtonsGrid
      driverCommands={executeMethods}
      startCommand={startCommand}
      isExecute={true}
      t={t}
    />
  </Space>
);

// Dynamic list of driver commands, generated from the driver's method map responses
const MethodMapCommandsList = (props) => {
  const {driverCommands, driverExecuteMethods, startCommand, t} = props;

  const hasNoCommands = _.isEmpty(driverCommands);
  const hasNoExecuteMethods = _.isEmpty(driverExecuteMethods);

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
          children: (
            <CommandsButtonGrid driverCommands={driverCommands} startCommand={startCommand} t={t} />
          ),
        },
        {
          label: t('executeMethods'),
          key: '2',
          disabled: hasNoExecuteMethods,
          children: (
            <ExecuteMethodsButtonGrid
              executeMethods={driverExecuteMethods.rest}
              startCommand={startCommand}
              t={t}
            />
          ),
        },
      ]}
    />
  );
};

export default MethodMapCommandsList;
