import {
  Alert,
  Button,
  Col,
  Collapse,
  Input,
  Modal,
  Row,
  Space,
  Switch,
  Tooltip,
  notification,
} from 'antd';
import _ from 'lodash';
import React from 'react';

import {ALERT, INPUT} from '../../constants/antd-types';
import {COMMAND_ARG_TYPES, COMMAND_DEFINITIONS} from '../../constants/commands';
import InspectorStyles from './Inspector.css';

const Commands = (props) => {
  const {
    pendingCommand,
    cancelPendingCommand,
    setCommandArg,
    applyClientMethod,
    automationName,
    t,
  } = props;

  const startPerformingCommand = (commandName, command) => {
    const {startEnteringCommandArgs} = props;
    if (_.isEmpty(command.args)) {
      applyClientMethod({
        methodName: commandName,
        args: [],
        skipRefresh: !command.refresh,
        ignoreResult: false,
      });
    } else {
      startEnteringCommandArgs(commandName, command);
    }
  };

  const parseJsonString = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      notification.error({
        message: t('invalidJson'),
        description: err.message,
        duration: 5,
      });
      return null;
    }
  };

  const executeCommand = () => {
    const {args, commandName, command} = pendingCommand;
    const {refresh} = command;

    // Make a copy of the arguments to avoid state mutation
    let copiedArgs = _.cloneDeep(args);

    let isJsonValid = true;

    // Special case for 'rotateDevice'
    if (commandName === 'rotateDevice') {
      copiedArgs = {
        x: args[0],
        y: args[1],
        duration: args[2],
        radius: args[3],
        rotation: args[4],
        touchCount: args[5],
      };
    }

    // Special case for 'setGeoLocation'
    if (commandName === 'setGeoLocation') {
      copiedArgs = {latitude: args[0], longitude: args[1], altitude: args[2]};
    }

    // Special case for 'executeScript'
    // Unlike other clients, webdriver/WDIO requires the argument object to be wrapped in an array,
    // but we should still allow omitting the array to avoid confusion for non-WDIO users.
    // So we can have 4 cases for the argument: undefined, "[]", "{...}", "[{...}]"
    if (commandName === 'executeScript') {
      if (_.isEmpty(args[1])) {
        copiedArgs[1] = [];
      } else {
        copiedArgs[1] = parseJsonString(args[1]);
        if (copiedArgs[1] === null) {
          isJsonValid = false;
        } else if (!_.isArray(copiedArgs[1])) {
          copiedArgs[1] = [copiedArgs[1]];
        }
      }
    }

    // Special case for 'updateSettings'
    if (commandName === 'updateSettings') {
      if (_.isString(args[0])) {
        copiedArgs[0] = parseJsonString(args[0]);
        if (copiedArgs[0] === null) {
          isJsonValid = false;
        }
      }
    }

    if (isJsonValid) {
      applyClientMethod({
        methodName: commandName,
        args: copiedArgs,
        skipRefresh: !refresh,
        ignoreResult: false,
      });
    }

    cancelPendingCommand();
  };

  const generateCommandNotes = (notes) =>
    notes.map((note) => (_.isArray(note) ? `${t(note[0])}: ${note[1]}` : t(note))).join('; ');

  return (
    <div className={InspectorStyles['commands-container']}>
      <Space className={InspectorStyles.spaceContainer} direction="vertical" size="middle">
        {t('commandsDescription')}
        <Collapse>
          {_.toPairs(COMMAND_DEFINITIONS).map(([commandGroup, commands]) => (
            <Collapse.Panel header={t(commandGroup)} key={commandGroup}>
              <Row>
                {_.toPairs(commands).map(
                  ([commandName, command], index) =>
                    (!command.drivers || command.drivers.includes(automationName)) && (
                      <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
                        <div className={InspectorStyles['btn-container']}>
                          <Tooltip
                            title={
                              command.notes && !command.args
                                ? generateCommandNotes(command.notes)
                                : null
                            }
                          >
                            <Button onClick={() => startPerformingCommand(commandName, command)}>
                              {commandName}
                            </Button>
                          </Tooltip>
                        </div>
                      </Col>
                    ),
                )}
              </Row>
            </Collapse.Panel>
          ))}
        </Collapse>
      </Space>
      {!!pendingCommand && (
        <Modal
          title={`${t('Enter Parameters for:')} ${t(pendingCommand.commandName)}`}
          okText={t('Execute Command')}
          cancelText={t('Cancel')}
          open={!!pendingCommand}
          onOk={() => executeCommand()}
          onCancel={() => cancelPendingCommand()}
        >
          {pendingCommand.command.notes && (
            <Alert
              message={generateCommandNotes(pendingCommand.command.notes)}
              type={ALERT.INFO}
              showIcon
            />
          )}
          {!_.isEmpty(pendingCommand.command.args) &&
            _.map(pendingCommand.command.args, ([argName, argType], index) => (
              <Row key={index} gutter={16}>
                <Col span={24} className={InspectorStyles['arg-container']}>
                  {argType === COMMAND_ARG_TYPES.NUMBER && (
                    <Input
                      type={INPUT.NUMBER}
                      value={pendingCommand.args[index]}
                      addonBefore={t(argName)}
                      onChange={(e) => setCommandArg(index, _.toNumber(e.target.value))}
                    />
                  )}
                  {argType === COMMAND_ARG_TYPES.BOOLEAN && (
                    <div>
                      {t(argName)}{' '}
                      <Switch
                        checked={pendingCommand.args[index]}
                        onChange={(v) => setCommandArg(index, v)}
                      />
                    </div>
                  )}
                  {argType === COMMAND_ARG_TYPES.STRING && (
                    <Input
                      addonBefore={t(argName)}
                      onChange={(e) => setCommandArg(index, e.target.value)}
                    />
                  )}
                </Col>
              </Row>
            ))}
        </Modal>
      )}
    </div>
  );
};

export default Commands;
