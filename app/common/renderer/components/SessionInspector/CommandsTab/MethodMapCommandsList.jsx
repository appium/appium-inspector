import {Button, Col, Collapse, Row, Tabs, Tooltip} from 'antd';
import _ from 'lodash';

import styles from './Commands.module.css';

const MethodMapButtonsGrid = ({driverCommands, prepareCommand, isExecute, t}) => {
  const InnerGrid = ({methodMap}) => (
    <Row>
      {_.toPairs(methodMap).map(([methodName, methodDetails], index) => (
        <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
          <div className={styles.btnContainer}>
            <Tooltip title={methodDetails.deprecated ? t('methodDeprecated') : null}>
              <Button
                className={methodDetails.deprecated ? styles.deprecatedMethod : ''}
                onClick={() =>
                  prepareCommand({name: methodName, details: methodDetails, isExecute})
                }
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

const CommandsButtonGrid = ({driverCommands, prepareCommand, t}) => (
  <MethodMapButtonsGrid
    driverCommands={driverCommands}
    prepareCommand={prepareCommand}
    isExecute={false}
    t={t}
  />
);

const ExecuteMethodsButtonGrid = ({executeMethods, prepareCommand, t}) => (
  <MethodMapButtonsGrid
    driverCommands={executeMethods}
    prepareCommand={prepareCommand}
    isExecute={true}
    t={t}
  />
);

// Dynamic list of driver commands, generated from the driver's method map responses
const MethodMapCommandsList = (props) => {
  const {driverCommands, driverExecuteMethods, prepareCommand, t} = props;

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
            <CommandsButtonGrid
              driverCommands={driverCommands}
              prepareCommand={prepareCommand}
              t={t}
            />
          ),
        },
        {
          label: t('executeMethods'),
          key: '2',
          disabled: hasNoExecuteMethods,
          children: (
            <ExecuteMethodsButtonGrid
              executeMethods={driverExecuteMethods.rest}
              prepareCommand={prepareCommand}
              t={t}
            />
          ),
        },
      ]}
    />
  );
};

export default MethodMapCommandsList;
