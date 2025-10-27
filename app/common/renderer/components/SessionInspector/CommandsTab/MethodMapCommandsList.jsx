import {Button, Col, Collapse, Row, Tabs} from 'antd';
import _ from 'lodash';

import styles from './Commands.module.css';

const MethodMapButtonsGrid = ({driverCommands, prepareCommand, isExecute}) => {
  const InnerGrid = ({methodMap}) => (
    <Row>
      {_.toPairs(methodMap).map(([methodName, methodProps], index) => (
        <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
          <div className={styles.btnContainer}>
            <Button
              onClick={() => prepareCommand({name: methodName, props: methodProps, isExecute})}
            >
              {methodName}
            </Button>
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

const CommandsButtonGrid = ({driverCommands, prepareCommand}) => (
  <MethodMapButtonsGrid
    driverCommands={driverCommands}
    prepareCommand={prepareCommand}
    isExecute={false}
  />
);

const ExecuteMethodsButtonGrid = ({executeMethods, prepareCommand}) => (
  <MethodMapButtonsGrid
    driverCommands={executeMethods}
    prepareCommand={prepareCommand}
    isExecute={true}
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
            />
          ),
        },
      ]}
    />
  );
};

export default MethodMapCommandsList;
