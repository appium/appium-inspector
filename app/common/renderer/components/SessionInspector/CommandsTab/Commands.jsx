import {ThunderboltOutlined} from '@ant-design/icons';
import {Card, Col, Input, Modal, Row} from 'antd';
import _ from 'lodash';
import {useEffect, useState} from 'react';

import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';
import MethodMapCommandsList from './MethodMapCommandsList.jsx';
import StaticCommandsList from './StaticCommandsList.jsx';

// Try to detect if the input value should be a boolean/number/array/object,
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
  const {applyClientMethod, storeSessionSettings, t} = props;

  const [hasMethodsMap, setHasMethodsMap] = useState(null);
  const [driverCommands, setDriverCommands] = useState(null);
  const [driverExecuteMethods, setDriverExecuteMethods] = useState(null);

  const [curCommandName, setCurCommandName] = useState(null);
  const [curCommandProps, setCurCommandProps] = useState(null);
  const [curCommandParams, setCurCommandParams] = useState([]);

  const startPerformingCommand = (commandName, commandProps) => {
    if (_.isEmpty(commandProps.params)) {
      applyClientMethod({
        methodName: commandName,
        args: [],
        skipRefresh: !commandProps.refresh,
        ignoreResult: false,
      });
    } else {
      setCurCommandProps(commandProps);
      setCurCommandName(commandName);
    }
  };

  const updateCommandParam = (index, value) => {
    const newCommandParams = [...curCommandParams];
    newCommandParams[index] = value;
    setCurCommandParams(newCommandParams);
  };

  const clearCurrentCommand = () => {
    setCurCommandName(null);
    setCurCommandProps(null);
    setCurCommandParams([]);
  };

  const executeCommand = () => {
    const {refresh} = curCommandProps;

    // Make a copy of the parameters to avoid state mutation
    let copiedParams = _.cloneDeep(curCommandParams);

    // Special case for 'rotateDevice'
    if (curCommandName === 'rotateDevice') {
      copiedParams = {
        x: curCommandParams[0],
        y: curCommandParams[1],
        duration: curCommandParams[2],
        radius: curCommandParams[3],
        rotation: curCommandParams[4],
        touchCount: curCommandParams[5],
      };
    }

    // Special case for 'setGeoLocation'
    if (curCommandName === 'setGeoLocation') {
      copiedParams = {
        latitude: curCommandParams[0],
        longitude: curCommandParams[1],
        altitude: curCommandParams[2],
      };
    }

    // Special case for 'executeScript'
    // Unlike other clients, webdriver/WDIO requires the argument object to be wrapped in an array,
    // but we should still allow omitting the array to avoid confusion for non-WDIO users.
    // So we can have 4 cases for the argument: undefined, [], {...}, [{...}]
    if (curCommandName === 'executeScript') {
      if (_.isEmpty(curCommandParams[1])) {
        copiedParams[1] = [];
      } else if (typeof curCommandParams[1] === 'object') {
        copiedParams[1] = !_.isArray(copiedParams[1]) ? [curCommandParams[1]] : curCommandParams[1];
      }
    }

    applyClientMethod({
      methodName: curCommandName,
      args: copiedParams,
      skipRefresh: !refresh,
      ignoreResult: false,
    });
    // if updating settings, store the updated values
    if (curCommandName === 'updateSettings') {
      storeSessionSettings(...copiedParams);
    }

    clearCurrentCommand();
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
        {!!curCommandName && (
          <Modal
            title={`${t('Enter Parameters for:')} ${t(curCommandName)}`}
            okText={t('Execute Command')}
            cancelText={t('Cancel')}
            open={!!curCommandName}
            onOk={() => executeCommand()}
            onCancel={() => clearCurrentCommand()}
          >
            {!_.isEmpty(curCommandProps.params) &&
              _.map(curCommandProps.params, ({name: argName}, index) => (
                <Row key={index} gutter={16}>
                  <Col span={24} className={styles.argContainer}>
                    <Input
                      addonBefore={argName}
                      onChange={(e) => updateCommandParam(index, adjustValueType(e.target.value))}
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
