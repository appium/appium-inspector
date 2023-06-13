import React, { Component } from 'react';
import _ from 'lodash';
import { Row, Col, Button, Select, Modal, Input, Switch, notification, } from 'antd';
import { COMMAND_DEFINITIONS, COMMAND_ARG_TYPES } from './shared';
import InspectorStyles from './Inspector.css';
import { INPUT } from '../AntdTypes';

export default class Commands extends Component {

  startPerformingCommand (commandName, command) {
    const { startEnteringCommandArgs, applyClientMethod } = this.props;
    if (_.isEmpty(command.args)) {
      applyClientMethod({methodName: command.methodName, args: [], skipRefresh: !command.refresh, ignoreResult: false});
    } else {
      startEnteringCommandArgs(commandName, command);
    }
  }

  executeCommand () {
    const { pendingCommand, cancelPendingCommand, applyClientMethod, t } = this.props;
    let {args, command} = pendingCommand;

    // Special case for 'rotateDevice'
    if (command.methodName === 'rotateDevice') {
      args = {x: args[0], y: args[1], duration: args[2], radius: args[3], rotation: args[4], touchCount: args[5]};
    }

    // Special case for 'setGeoLocation'
    if (command.methodName === 'setGeoLocation') {
      args = {latitude: args[0], longitude: args[1], altitude: args[2]};
    }

    // Special case for 'execute'
    if (command.methodName === 'executeScript') {
      if (!_.isEmpty(args[1])) {
        try {
          args[1] = JSON.parse(args[1]);
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
          args[0] = JSON.parse(args[0]);
        } catch (e) {
          notification.error({
            message: t('invalidJson', {json: args[0]}),
            duration: 5,
          });
        }
      }
    }

    applyClientMethod({methodName: command.methodName, args, skipRefresh: !command.refresh, ignoreResult: false});
    cancelPendingCommand();
  }

  render () {
    const {
      t, selectCommandGroup, selectCommandSubGroup, selectedCommandGroup, selectedCommandSubGroup, pendingCommand,
      cancelPendingCommand, setCommandArg } = this.props;
    return <div className={InspectorStyles['commands-container']}>
      <Row gutter={16} className={InspectorStyles['arg-row']}>
        <Col span={24}>
          <Select onChange={(commandGroupName) => selectCommandGroup(commandGroupName)} placeholder={t('Select Command Group')}>
            { _.keys(COMMAND_DEFINITIONS).map((commandGroup) => <Select.Option key={commandGroup}>{t(commandGroup)}</Select.Option>) }
          </Select>
        </Col>
      </Row>
      {selectedCommandGroup && <Row>
        <Col span={24}>
          <Select onChange={(commandGroupName) => selectCommandSubGroup(commandGroupName)} placeholder={t('Select Sub Group')}>
            { _.keys(COMMAND_DEFINITIONS[selectedCommandGroup]).map((commandGroup) => <Select.Option key={commandGroup}>{t(commandGroup)}</Select.Option>) }
          </Select>
        </Col>
      </Row>}
      <Row>
        {selectedCommandSubGroup && _.toPairs(COMMAND_DEFINITIONS[selectedCommandGroup][selectedCommandSubGroup]).map(([commandName, command], index) => <Col key={index} span={8}>
          <div className={InspectorStyles['btn-container']}>
            <Button onClick={() => this.startPerformingCommand(commandName, command)}>{t(commandName)}</Button>
          </div>
        </Col>)}
      </Row>
      {!!pendingCommand && <Modal
        title={t(pendingCommand.commandName)}
        okText={t('Execute Command')}
        cancelText={t('Cancel')}
        open={!!pendingCommand}
        onOk={() => this.executeCommand()}
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
  }
}
