import {ThunderboltOutlined} from '@ant-design/icons';
import {Card, Input, Modal, Space, Typography} from 'antd';
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
        <Typography.Text type="danger">*</Typography.Text>&nbsp;{param.name}
      </>
    );
  }
  return param.name;
};

const Commands = (props) => {
  const {applyClientMethod, getSupportedSessionMethods, storeSessionSettings, t} = props;

  const [hasMethodsMap, setHasMethodsMap] = useState(null);
  const [driverCommands, setDriverCommands] = useState(null);
  const [driverExecuteMethods, setDriverExecuteMethods] = useState(null);

  const [curCommandDetails, setCurCommandDetails] = useState(null);
  const curCommandParamValsRef = useRef([]);

  const [commandResult, setCommandResult] = useState(undefined);

  const startCommand = (commandDetails) => {
    setCurCommandDetails(commandDetails);
    if (_.isEmpty(commandDetails.details.params)) {
      prepareAndRunCommand(commandDetails);
    }
  };

  const prepareCommand = (cmdName, cmdParams, isExecute) => {
    const adjustedCmdName = isExecute ? COMMAND_EXECUTE_SCRIPT : cmdName;
    let adjustedCmdParams = curCommandParamValsRef.current.map(adjustParamValueType);

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
    setCommandResult(res);
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
    setCommandResult(undefined);
    setCurCommandDetails(null);
    curCommandParamValsRef.current = [];
  };

  useEffect(() => {
    (async () => {
      const {commands, executeMethods} = await getSupportedSessionMethods();
      setHasMethodsMap(!(_.isEmpty(commands) && _.isEmpty(executeMethods)));
      setDriverCommands(transformCommandsMap(commands));
      setDriverExecuteMethods(transformExecMethodsMap(executeMethods));
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
            title={t('enterMethodParameters', {methodName: curCommandDetails.name})}
            okText={t('Execute Command')}
            open={!_.isEmpty(curCommandDetails.details.params)}
            onOk={() => prepareAndRunCommand(curCommandDetails)}
            onCancel={() => clearCurrentCommand()}
            footer={(_, {OkBtn}) => <OkBtn />}
          >
            {_.map(curCommandDetails.details.params, (param, index) => (
              <Space.Compact block key={index} className={styles.commandArgInputRow}>
                <Space.Addon>{formatParamInputLabel(param)}</Space.Addon>
                <Input onChange={(e) => (curCommandParamValsRef.current[index] = e.target.value)} />
              </Space.Compact>
            ))}
          </Modal>
        )}
        {commandResult !== undefined && (
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
