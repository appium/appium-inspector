import {ThunderboltOutlined} from '@ant-design/icons';
import {Card, Col, Input, Modal, Row, Typography} from 'antd';
import _ from 'lodash';
import {useEffect, useState} from 'react';

import {
  adjustParamValueType,
  transformCommandsMap,
  transformExecMethodsMap,
} from '../../../utils/commands-tab.js';
import inspectorStyles from '../SessionInspector.module.css';
import CommandResultModal from './CommandResultModal.jsx';
import styles from './Commands.module.css';
import MethodMapCommandsList from './MethodMapCommandsList.jsx';
import StaticCommandsList from './StaticCommandsList.jsx';

const formatParamInputLabel = (param) => {
  if (param.required) {
    return (
      <>
        <Typography.Text type="danger">*</Typography.Text> {param.name}
      </>
    );
  }
  return param.name;
};

const Commands = (props) => {
  const {applyClientMethod, storeSessionSettings, t} = props;

  const [hasMethodsMap, setHasMethodsMap] = useState(null);
  const [driverCommands, setDriverCommands] = useState(null);
  const [driverExecuteMethods, setDriverExecuteMethods] = useState(null);

  const [curCommandDetails, setCurCommandDetails] = useState(null);
  const [curCommandParamVals, setCurCommandParamVals] = useState([]);

  const [commandResult, setCommandResult] = useState(null);

  const startCommand = (commandDetails) => {
    setCurCommandDetails(commandDetails);
    if (_.isEmpty(commandDetails.details.params)) {
      prepareAndRunCommand(commandDetails);
    }
  };

  const updateCommandParamVal = (index, value) => {
    const newCommandParamVals = [...curCommandParamVals];
    newCommandParamVals[index] = value;
    setCurCommandParamVals(newCommandParamVals);
  };

  const prepareCommand = (cmdName, cmdParams, isExecute) => {
    const adjustedCmdName = isExecute ? 'executeScript' : cmdName;
    let adjustedCmdParams = _.cloneDeep(curCommandParamVals).map((val) =>
      adjustParamValueType(val),
    );

    // If we are about to run an execute method,
    // the parameters array needs to be turned into an object,
    // and the command name added as a separate parameter.
    if (isExecute) {
      const cmdParamNames = _.map(cmdParams, 'name');
      const mappedCmdParams = _.zipObject(cmdParamNames, adjustedCmdParams);
      adjustedCmdParams = [cmdName, mappedCmdParams];
    }

    // Special case for 'executeScript'
    // Unlike other clients, webdriver/WDIO requires the argument object to be wrapped in an array,
    // but we should still allow omitting the array to avoid confusion for non-WDIO users.
    // So we can have 5 cases for the argument: undefined, {}, [], {...}, [{...}]
    if (adjustedCmdName === 'executeScript') {
      if (_.isEmpty(adjustedCmdParams[1])) {
        adjustedCmdParams[1] = [];
      } else if (typeof adjustedCmdParams[1] === 'object' && !_.isArray(adjustedCmdParams[1])) {
        adjustedCmdParams[1] = [adjustedCmdParams[1]];
      }
    }
    return [adjustedCmdName, adjustedCmdParams];
  };

  const runCommand = async (methodName, args, skipRefresh) => {
    const res = await applyClientMethod({
      methodName,
      args,
      skipRefresh,
    });
    const formattedResult =
      _.isObject(res) && _.isEmpty(res) ? null : JSON.stringify(res, null, '  ');
    setCommandResult(formattedResult);
  };

  const prepareAndRunCommand = (commandDetails) => {
    const {
      name: cmdName,
      details: {params: cmdParams, refresh = false},
      isExecute = false,
    } = commandDetails;

    const [newCmdName, newCmdParams] = prepareCommand(cmdName, cmdParams, isExecute);
    // Do not await - let the command run in the background without blocking the UI
    runCommand(newCmdName, newCmdParams, !refresh);

    // if updating settings, store the updated values
    if (newCmdName === 'updateSettings') {
      storeSessionSettings(newCmdParams[0]);
    }
  };

  const clearCurrentCommand = () => {
    setCommandResult(null);
    setCurCommandDetails(null);
    setCurCommandParamVals([]);
  };

  useEffect(() => {
    const {getSupportedSessionMethods} = props;
    (async () => {
      const {commands, executeMethods} = await getSupportedSessionMethods();
      setHasMethodsMap(!(_.isEmpty(commands) && _.isEmpty(executeMethods)));
      setDriverCommands(transformCommandsMap(commands));
      setDriverExecuteMethods(transformExecMethodsMap(executeMethods));
    })();
  }, []);

  return (
    <Card
      title={
        <span>
          <ThunderboltOutlined /> {t('Execute Commands')}
        </span>
      }
      className={inspectorStyles.interactionTabCard}
    >
      <div className={styles.commandsContainer}>
        {hasMethodsMap === false && <StaticCommandsList startCommand={startCommand} t={t} />}
        {hasMethodsMap && (
          <MethodMapCommandsList
            driverCommands={driverCommands}
            driverExecuteMethods={driverExecuteMethods}
            startCommand={startCommand}
            t={t}
          />
        )}
        {!!curCommandDetails && (
          <Modal
            title={`${t('Enter Parameters for:')} ${t(curCommandDetails.name)}`}
            okText={t('Execute Command')}
            cancelText={t('Cancel')}
            open={!_.isEmpty(curCommandDetails.details.params)}
            onOk={() => prepareAndRunCommand(curCommandDetails)}
            onCancel={() => clearCurrentCommand()}
          >
            {_.map(curCommandDetails.details.params, (param, index) => (
              <Row key={index} gutter={16}>
                <Col span={24} className={styles.argContainer}>
                  <Input
                    addonBefore={formatParamInputLabel(param)}
                    onChange={(e) => updateCommandParamVal(index, e.target.value)}
                  />
                </Col>
              </Row>
            ))}
          </Modal>
        )}
        {commandResult && (
          <CommandResultModal
            commandName={curCommandDetails.name}
            commandResult={commandResult}
            clearCurrentCommand={clearCurrentCommand}
            t={t}
          />
        )}
      </div>
    </Card>
  );
};

export default Commands;
