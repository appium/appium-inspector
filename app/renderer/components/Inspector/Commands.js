import React from 'react';
import _ from 'lodash';
import { Row, Col, Button, Collapse, Modal, Input, Switch, Space, notification } from 'antd';
import { COMMAND_DEFINITIONS, COMMAND_ARG_TYPES } from './shared';
import InspectorStyles from './Inspector.css';
import { INPUT } from '../AntdTypes';

const Commands = (props) => {
  const { pendingCommand, cancelPendingCommand, setCommandArg, applyClientMethod, t } = props;

  const startPerformingCommand = (commandName, command) => {
    const { startEnteringCommandArgs } = props;
    if (_.isEmpty(command.args)) {
      applyClientMethod({methodName: commandName, args: [], skipRefresh: !command.refresh, ignoreResult: false});
    } else {
      startEnteringCommandArgs(commandName, command);
    }
  };

  const executeCommand = () => {
    const { args, command } = pendingCommand;

    // Make a copy of the arguments to avoid state mutation
    let copiedArgs = _.cloneDeep(args);

    // Special case for 'rotateDevice'
    if (command.methodName === 'rotateDevice') {
      copiedArgs = {x: args[0], y: args[1], duration: args[2], radius: args[3], rotation: args[4], touchCount: args[5]};
    }

    // Special case for 'setGeoLocation'
    if (command.methodName === 'setGeoLocation') {
      copiedArgs = {latitude: args[0], longitude: args[1], altitude: args[2]};
    }

    // Special case for 'execute'
    if (command.methodName === 'executeScript') {
      if (!_.isEmpty(args[1])) {
        try {
          copiedArgs[1] = JSON.parse(args[1]);
        } catch (e) {
          notification.error({
            message: t('invalidJson', {json: args[1]}),
            duration: 5,
          });
        }
      }
    }

    // Special case for 'updateSettings'
    if (command.methodName === 'updateSettings') {
      if (_.isString(args[0])) {
        try {
          copiedArgs[0] = JSON.parse(args[0]);
        } catch (e) {
          notification.error({
            message: t('invalidJson', {json: args[0]}),
            duration: 5,
          });
        }
      }
    }

    applyClientMethod({methodName: command.methodName, args: copiedArgs, skipRefresh: !command.refresh, ignoreResult: false});
    cancelPendingCommand();
  };

  return <div className={InspectorStyles['commands-container']}>
    <Space className={InspectorStyles.spaceContainer} direction='vertical' size='middle'>
      {t('commandsDescription')}
      <Collapse>
        { _.toPairs(COMMAND_DEFINITIONS).map(([commandGroup, commands]) =>
          <Collapse.Panel header={t(commandGroup)} key={commandGroup}>
            <Row>
              {_.toPairs(commands).map(([commandName, command], index) =>
                <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
                  <div className={InspectorStyles['btn-container']}>
                    <Button onClick={() => startPerformingCommand(commandName, command)}>
                      {commandName}
                    </Button>
                  </div>
                </Col>
              )}
            </Row>
          </Collapse.Panel>
        )}
      </Collapse>
    </Space>
    {!!pendingCommand && <Modal
      title={`${t('Enter Parameters for:')} ${t(pendingCommand.commandName)}`}
      okText={t('Execute Command')}
      cancelText={t('Cancel')}
      open={!!pendingCommand}
      onOk={() => executeCommand()}
      onCancel={() => cancelPendingCommand()}>
      {
        !_.isEmpty(pendingCommand.command.args) && _.map(pendingCommand.command.args, ([argName, argType], index) => <Row key={index} gutter={16}>
          <Col span={24} className={InspectorStyles['arg-container']}>
            {
              argType === COMMAND_ARG_TYPES.NUMBER && <Input
                type={INPUT.NUMBER}
                value={pendingCommand.args[index]}
                addonBefore={t(argName)}
                onChange={(e) => setCommandArg(index, _.toNumber(e.target.value))}
              />
            }
            {argType === COMMAND_ARG_TYPES.BOOLEAN && <div>{t(argName)} <Switch checked={pendingCommand.args[index]} onChange={(v) => setCommandArg(index, v)} /></div>}
            {argType === COMMAND_ARG_TYPES.STRING && <Input addonBefore={t(argName)} onChange={(e) => setCommandArg(index, e.target.value)}/>}
          </Col>
        </Row>)
      }
    </Modal>}
  </div>;
};

export default Commands;
