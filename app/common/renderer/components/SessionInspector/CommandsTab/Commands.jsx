import {ThunderboltOutlined} from '@ant-design/icons';
import {Card, Col, Input, Modal, Row, Typography} from 'antd';
import _ from 'lodash';
import {useEffect, useRef, useState} from 'react';

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

const COMMAND_EXECUTE_SCRIPT = 'executeScript';
const COMMAND_UPDATE_SETTINGS = 'updateSettings';

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
  const {applyClientMethod, getSupportedSessionMethods, storeSessionSettings, t} = props;

  const [hasMethodsMap, setHasMethodsMap] = useState(null);
  const driverCommands = useRef(null);
  const driverExecuteMethods = useRef(null);

  const [curCommandDetails, setCurCommandDetails] = useState(null);
  const curCommandParamVals = useRef([]);

  const [commandResult, setCommandResult] = useState(null);

  const startCommand = (commandDetails) => {
    setCurCommandDetails(commandDetails);
    if (_.isEmpty(commandDetails.details.params)) {
      prepareAndRunCommand(commandDetails);
    }
  };

  const prepareCommand = (cmdName, cmdParams, isExecute) => {
    const adjustedCmdName = isExecute ? COMMAND_EXECUTE_SCRIPT : cmdName;
    let adjustedCmdParams = curCommandParamVals.current.map(adjustParamValueType);

    // If we are about to run an execute method,
    // the parameters array needs to be turned into an object,
    // and the command name added as a separate parameter.
    if (isExecute) {
      const cmdParamNames = _.map(cmdParams, 'name');
      const mappedCmdParams = _.zipObject(cmdParamNames, adjustedCmdParams);
      adjustedCmdParams = [cmdName, mappedCmdParams];
    }

    // The WebDriver spec for 'executeScript' requires 'args' to be an array
    // (https://w3c.github.io/webdriver/#dfn-extract-the-script-arguments-from-a-request),
    // but if the script doesn't use any arguments, we allow the user to omit it.
    // So we can have 5 cases for 'args': undefined, {}, [], {...}, [{...}]
    if (adjustedCmdName === COMMAND_EXECUTE_SCRIPT) {
      if (_.isEmpty(adjustedCmdParams[1])) {
        adjustedCmdParams[1] = [];
      } else if (_.isPlainObject(adjustedCmdParams[1])) {
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
    const formattedResult = _.isObject(res) && _.isEmpty(res) ? null : JSON.stringify(res, null, 2);
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
    if (newCmdName === COMMAND_UPDATE_SETTINGS) {
      storeSessionSettings(newCmdParams[0]);
    }
  };

  const clearCurrentCommand = () => {
    setCommandResult(null);
    setCurCommandDetails(null);
    curCommandParamVals.current = [];
  };

  useEffect(() => {
    (async () => {
      const {commands, executeMethods} = await getSupportedSessionMethods();
      setHasMethodsMap(!(_.isEmpty(commands) && _.isEmpty(executeMethods)));
      driverCommands.current = transformCommandsMap(commands);
      driverExecuteMethods.current = transformExecMethodsMap(executeMethods);
    })();
  }, [getSupportedSessionMethods]);

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
            open={!_.isEmpty(curCommandDetails.details.params)}
            onOk={() => prepareAndRunCommand(curCommandDetails)}
            onCancel={() => clearCurrentCommand()}
            footer={(_, {OkBtn}) => <OkBtn />}
          >
            {_.map(curCommandDetails.details.params, (param, index) => (
              <Row key={index} gutter={16}>
                <Col span={24} className={styles.argContainer}>
                  <Input
                    addonBefore={formatParamInputLabel(param)}
                    onChange={(e) => (curCommandParamVals.current[index] = e.target.value)}
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
