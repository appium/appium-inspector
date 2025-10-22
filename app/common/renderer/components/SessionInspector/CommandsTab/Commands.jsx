import {ThunderboltOutlined} from '@ant-design/icons';
import {Card, Col, Input, Modal, Row} from 'antd';
import _ from 'lodash';
import {useEffect, useState} from 'react';

import {notification} from '../../../utils/notification.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';
import MethodMapCommandsList from './MethodMapCommandsList.jsx';
import StaticCommandsList from './StaticCommandsList.jsx';

// Try to detect if the input value should be a boolean/number/object,
// and if so, convert it to that
const adjustValueType = (value) => {
  if (Number(value).toString() === value) {
    return Number(value);
  } else if (['true', 'false'].includes(value)) {
    return value === 'true';
  } else {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
};

const Commands = (props) => {
  const {
    pendingCommand,
    cancelPendingCommand,
    setCommandArg,
    applyClientMethod,
    storeSessionSettings,
    t,
  } = props;

  const [hasMethodsMap, setHasMethodsMap] = useState(null);
  const [driverCommands, setDriverCommands] = useState(null);
  const [driverExecuteMethods, setDriverExecuteMethods] = useState(null);

  const startPerformingCommand = (commandName, commandProps) => {
    const {startEnteringCommandArgs} = props;
    if (_.isEmpty(commandProps.params)) {
      applyClientMethod({
        methodName: commandName,
        args: [],
        skipRefresh: !commandProps.refresh,
        ignoreResult: false,
      });
    } else {
      startEnteringCommandArgs(commandName, commandProps);
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
    const {params, commandName, commandProps} = pendingCommand;
    const {refresh} = commandProps;

    // Make a copy of the parameters to avoid state mutation
    let copiedParams = _.cloneDeep(params);

    let isJsonValid = true;

    // Special case for 'rotateDevice'
    if (commandName === 'rotateDevice') {
      copiedParams = {
        x: params[0],
        y: params[1],
        duration: params[2],
        radius: params[3],
        rotation: params[4],
        touchCount: params[5],
      };
    }

    // Special case for 'setGeoLocation'
    if (commandName === 'setGeoLocation') {
      copiedParams = {latitude: params[0], longitude: params[1], altitude: params[2]};
    }

    // Special case for 'executeScript'
    // Unlike other clients, webdriver/WDIO requires the argument object to be wrapped in an array,
    // but we should still allow omitting the array to avoid confusion for non-WDIO users.
    // So we can have 4 cases for the argument: undefined, "[]", "{...}", "[{...}]"
    if (commandName === 'executeScript') {
      if (_.isEmpty(params[1])) {
        copiedParams[1] = [];
      } else {
        copiedParams[1] = parseJsonString(params[1]);
        if (copiedParams[1] === null) {
          isJsonValid = false;
        } else if (!_.isArray(copiedParams[1])) {
          copiedParams[1] = [copiedParams[1]];
        }
      }
    }

    // Special case for 'updateSettings'
    if (commandName === 'updateSettings') {
      if (_.isString(params[0])) {
        copiedParams[0] = parseJsonString(params[0]);
        if (copiedParams[0] === null) {
          isJsonValid = false;
        }
      }
    }

    if (isJsonValid) {
      applyClientMethod({
        methodName: commandName,
        args: copiedParams,
        skipRefresh: !refresh,
        ignoreResult: false,
      });
      // if updating settings, store the updated values
      if (commandName === 'updateSettings') {
        storeSessionSettings(...copiedParams);
      }
    }

    cancelPendingCommand();
  };

  useEffect(() => {
    const {getSupportedSessionMethods} = props;
    (async () => {
      const {commands, executeMethods} = await getSupportedSessionMethods();
      setHasMethodsMap(!(_.isEmpty(commands) && _.isEmpty(executeMethods)));
      setDriverCommands(commands);
      setDriverExecuteMethods(executeMethods);
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
        {hasMethodsMap === false && (
          <StaticCommandsList startPerformingCommand={startPerformingCommand} t={t} />
        )}
        {hasMethodsMap && (
          <MethodMapCommandsList
            driverCommands={driverCommands}
            driverExecuteMethods={driverExecuteMethods}
            startPerformingCommand={startPerformingCommand}
            t={t}
          />
        )}
        {!!pendingCommand && (
          <Modal
            title={`${t('Enter Parameters for:')} ${t(pendingCommand.commandName)}`}
            okText={t('Execute Command')}
            cancelText={t('Cancel')}
            open={!!pendingCommand}
            onOk={() => executeCommand()}
            onCancel={() => cancelPendingCommand()}
          >
            {!_.isEmpty(pendingCommand.commandProps.params) &&
              _.map(pendingCommand.commandProps.params, ({name: argName}, index) => (
                <Row key={index} gutter={16}>
                  <Col span={24} className={styles.argContainer}>
                    <Input
                      addonBefore={argName}
                      onChange={(e) => setCommandArg(index, adjustValueType(e.target.value))}
                    />
                  </Col>
                </Row>
              ))}
          </Modal>
        )}
      </div>
    </Card>
  );
};

export default Commands;
