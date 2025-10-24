import {Button, Col, Collapse, Row, Tabs} from 'antd';
import _ from 'lodash';

import styles from './Commands.module.css';

const filterEmpty = (itemMap) => _.pickBy(itemMap, (v) => !_.isEmpty(v));

const CommandsButtonGrid = ({restDriverCommands, prepareCommand}) => (
  <Collapse
    items={_.toPairs(filterEmpty(restDriverCommands)).map(
      ([commandSource, commandPathsToMethodsMap]) => ({
        key: commandSource,
        label: _.capitalize(commandSource),
        children: (
          <Row>
            {Object.values(filterEmpty(commandPathsToMethodsMap)).map((commandMethodsMap) =>
              Object.values(filterEmpty(commandMethodsMap)).map((commandItem, index) => (
                <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
                  <div className={styles.btnContainer}>
                    <Button
                      onClick={() =>
                        prepareCommand({name: commandItem.command, props: commandItem})
                      }
                    >
                      {commandItem.command}
                    </Button>
                  </div>
                </Col>
              )),
            )}
          </Row>
        ),
      }),
    )}
  />
);

const ExecuteMethodsButtonGrid = ({executeMethods, prepareCommand}) => {
  const InnerGrid = ({methodMap}) => (
    <Row>
      {_.toPairs(methodMap).map(([methodName, methodProps], index) => (
        <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
          <div className={styles.btnContainer}>
            <Button
              onClick={() =>
                prepareCommand({name: methodName, props: methodProps, isExecute: true})
              }
            >
              {methodName}
            </Button>
          </div>
        </Col>
      ))}
    </Row>
  );

  return _.size(executeMethods) === 1 ? (
    <InnerGrid methodMap={Object.values(executeMethods)[0]} />
  ) : (
    <Collapse
      items={_.toPairs(executeMethods).map(([methodSource, methodMap]) => ({
        key: methodSource,
        label: _.capitalize(methodSource),
        children: <InnerGrid methodMap={methodMap} />,
      }))}
    />
  );
};

// Dynamic list of driver commands, generated from the driver's method map responses
const MethodMapCommandsList = (props) => {
  const {driverCommands, driverExecuteMethods, prepareCommand, t} = props;

  const hasNoCommands = _.isEmpty(driverCommands) || !('rest' in driverCommands);
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
              restDriverCommands={driverCommands.rest}
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
