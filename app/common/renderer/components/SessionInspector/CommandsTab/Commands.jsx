import {ThunderboltOutlined} from '@ant-design/icons';
import {Card, Col, Input, Modal, Row} from 'antd';
import _ from 'lodash';
import {useEffect, useState} from 'react';

import {
  adjustParamValueType,
  deepFilterEmpty,
  filterAvailableCommands,
} from '../../../utils/commands-tab.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';
import MethodMapCommandsList from './MethodMapCommandsList.jsx';
import StaticCommandsList from './StaticCommandsList.jsx';

const Commands = (props) => {
  const {applyClientMethod, storeSessionSettings, t} = props;

  const [hasMethodsMap, setHasMethodsMap] = useState(null);
  const [driverCommands, setDriverCommands] = useState(null);
  const [driverExecuteMethods, setDriverExecuteMethods] = useState(null);

  const [curCommandDetails, setCurCommandDetails] = useState(null);
  const [curCommandParams, setCurCommandParams] = useState([]);

  const prepareCommand = (commandDetails) => {
    setCurCommandDetails(commandDetails);
    if (_.isEmpty(commandDetails.details.params)) {
      runCommand(commandDetails);
    }
  };

  const updateCommandParam = (index, value) => {
    const newCommandParams = [...curCommandParams];
    newCommandParams[index] = value;
    setCurCommandParams(newCommandParams);
  };

  const runCommand = (commandDetails) => {
    const {
      name: cmdName,
      details: {refresh = false},
      isExecute = false,
    } = commandDetails;

    // The default behavior is to pass command parameters as a flat array,
    // since they are sent using an apply() call.
    // However, some commands expect an object, and will need adjustments.
    let adjustedCmdName = cmdName;
    let adjustedCmdParams = _.cloneDeep(curCommandParams);
    // If we are about to run an execute method,
    // the parameters array needs to be turned into an object,
    // and the command name added as a separate parameter.
    if (isExecute) {
      adjustedCmdName = 'executeScript';
      const cmdParamNames = _.map(commandDetails.details.params, 'name');
      const mappedCmdParams = _.zipObject(cmdParamNames, adjustedCmdParams);
      adjustedCmdParams = [cmdName, mappedCmdParams];
    }

    // Special case for 'rotateDevice'
    if (adjustedCmdName === 'rotateDevice') {
      adjustedCmdParams = {
        x: curCommandParams[0],
        y: curCommandParams[1],
        duration: curCommandParams[2],
        radius: curCommandParams[3],
        rotation: curCommandParams[4],
        touchCount: curCommandParams[5],
      };
    }

    // Special case for 'setGeoLocation'
    if (adjustedCmdName === 'setGeoLocation') {
      adjustedCmdParams = {
        latitude: curCommandParams[0],
        longitude: curCommandParams[1],
        altitude: curCommandParams[2],
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

    applyClientMethod({
      methodName: adjustedCmdName,
      args: adjustedCmdParams,
      skipRefresh: !refresh,
      ignoreResult: false,
    });
    // if updating settings, store the updated values
    if (adjustedCmdName === 'updateSettings') {
      storeSessionSettings(adjustedCmdParams[0]);
    }

    clearCurrentCommand();
  };

  const clearCurrentCommand = () => {
    setCurCommandDetails(null);
    setCurCommandParams([]);
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
        {hasMethodsMap === false && <StaticCommandsList prepareCommand={prepareCommand} t={t} />}
        {hasMethodsMap && (
          <MethodMapCommandsList
            driverCommands={driverCommands}
            driverExecuteMethods={driverExecuteMethods}
            prepareCommand={prepareCommand}
            t={t}
          />
        )}
        {!!curCommandDetails && (
          <Modal
            title={`${t('Enter Parameters for:')} ${t(curCommandDetails.name)}`}
            okText={t('Execute Command')}
            cancelText={t('Cancel')}
            open={!_.isEmpty(curCommandDetails.details.params)}
            onOk={() => runCommand(curCommandDetails)}
            onCancel={() => clearCurrentCommand()}
          >
            {_.map(curCommandDetails.details.params, ({name: argName}, index) => (
              <Row key={index} gutter={16}>
                <Col span={24} className={styles.argContainer}>
                  <Input
                    addonBefore={argName}
                    onChange={(e) =>
                      updateCommandParam(index, adjustParamValueType(e.target.value))
                    }
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
