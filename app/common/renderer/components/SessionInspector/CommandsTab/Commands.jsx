import {ThunderboltOutlined} from '@ant-design/icons';
import {Card, Col, Input, Modal, Row, Typography} from 'antd';
import _ from 'lodash';
import {useEffect, useState} from 'react';

import {
  adjustParamValueType,
  deepFilterEmpty,
  filterAvailableCommands,
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
  const {
    applyClientMethod,
    storeSessionSettings,
    visibleCommandMethod,
    visibleCommandResult,
    setVisibleCommandResult,
    t,
  } = props;

  const [hasMethodsMap, setHasMethodsMap] = useState(null);
  const [driverCommands, setDriverCommands] = useState(null);
  const [driverExecuteMethods, setDriverExecuteMethods] = useState(null);

  const [curCommandDetails, setCurCommandDetails] = useState(null);
  const [curCommandParamVals, setCurCommandParamVals] = useState([]);

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
    let adjustedCmdName = cmdName;
    let adjustedCmdParams = _.cloneDeep(curCommandParamVals);
    // If we are about to run an execute method,
    // the parameters array needs to be turned into an object,
    // and the command name added as a separate parameter.
    if (isExecute) {
      adjustedCmdName = 'executeScript';
      const cmdParamNames = _.map(cmdParams, 'name');
      const mappedCmdParams = _.zipObject(cmdParamNames, adjustedCmdParams);
      adjustedCmdParams = [cmdName, mappedCmdParams];
    }

    // Special case for 'rotateDevice'
    if (adjustedCmdName === 'rotateDevice') {
      adjustedCmdParams = {
        x: curCommandParamVals[0],
        y: curCommandParamVals[1],
        duration: curCommandParamVals[2],
        radius: curCommandParamVals[3],
        rotation: curCommandParamVals[4],
        touchCount: curCommandParamVals[5],
      };
    }

    // Special case for 'setGeoLocation'
    if (adjustedCmdName === 'setGeoLocation') {
      adjustedCmdParams = {
        latitude: curCommandParamVals[0],
        longitude: curCommandParamVals[1],
        altitude: curCommandParamVals[2],
      };
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
    await applyClientMethod({
      methodName,
      args,
      skipRefresh,
      ignoreResult: false,
    });
  };

  const prepareAndRunCommand = (commandDetails) => {
    const {
      name: cmdName,
      details: {cmdParams, refresh = false},
      isExecute = false,
    } = commandDetails;

    const [newCmdName, newCmdParams] = prepareCommand(cmdName, cmdParams, isExecute);
    // Do not await - let the command run in the background without blocking the UI
    runCommand(newCmdName, newCmdParams, !refresh);

    // if updating settings, store the updated values
    if (newCmdName === 'updateSettings') {
      storeSessionSettings(newCmdParams[0]);
    }

    clearCurrentCommand();
  };

  const clearCurrentCommand = () => {
    setCurCommandDetails(null);
    setCurCommandParamVals([]);
  };

  useEffect(() => {
    const {getSupportedSessionMethods} = props;
    (async () => {
      const {commands, executeMethods} = await getSupportedSessionMethods();
      setHasMethodsMap(!(_.isEmpty(commands) && _.isEmpty(executeMethods)));
      setDriverCommands(filterAvailableCommands(commands));
      setDriverExecuteMethods(deepFilterEmpty(executeMethods));
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
                    onChange={(e) =>
                      updateCommandParamVal(index, adjustParamValueType(e.target.value))
                    }
                  />
                </Col>
              </Row>
            ))}
          </Modal>
        )}
        <CommandResultModal
          visibleCommandMethod={visibleCommandMethod}
          visibleCommandResult={visibleCommandResult}
          setVisibleCommandResult={setVisibleCommandResult}
          t={t}
        />
      </div>
    </Card>
  );
};

export default Commands;
