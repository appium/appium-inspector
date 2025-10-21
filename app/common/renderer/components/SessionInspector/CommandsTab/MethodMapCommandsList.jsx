import {Button, Col, Collapse, Row, Tabs} from 'antd';
import _ from 'lodash';

import styles from './Commands.module.css';

const CommandsButtonGrid = ({restDriverCommands}) => (
  <Collapse
    items={_.toPairs(restDriverCommands).map(([commandSource, commandPathsToMethodsMap]) => ({
      key: commandSource,
      label: _.capitalize(commandSource),
      children: (
        <Row>
          {Object.values(commandPathsToMethodsMap).map((commandMethodsMap) =>
            Object.values(commandMethodsMap).map((commandItem, index) => (
              <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
                <div className={styles.btnContainer}>
                  <Button>{commandItem.command}</Button>
                </div>
              </Col>
            )),
          )}
        </Row>
      ),
    }))}
  />
);

const ExecuteMethodsButtonGrid = ({executeMethods}) => (
  <Collapse
    items={_.toPairs(executeMethods).map(([methodSource, methodMap]) => ({
      key: methodSource,
      label: _.capitalize(methodSource),
      children: (
        <Row>
          {_.toPairs(methodMap).map(([methodName], index) => (
            <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
              <div className={styles.btnContainer}>
                <Button>{methodName}</Button>
              </div>
            </Col>
          ))}
        </Row>
      ),
    }))}
  />
);

// Dynamic list of driver commands, generated from the driver's method map responses
const MethodMapCommandsList = (props) => {
  const {driverCommands, driverExecuteMethods, t} = props;

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
          children: <CommandsButtonGrid restDriverCommands={driverCommands.rest} />,
        },
        {
          label: t('executeMethods'),
          key: '2',
          disabled: hasNoExecuteMethods,
          children: <ExecuteMethodsButtonGrid executeMethods={driverExecuteMethods.rest} />,
        },
      ]}
    />
  );
};

export default MethodMapCommandsList;
