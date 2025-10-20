import {Button, Col, Collapse, Row, Space, Tooltip} from 'antd';
import _ from 'lodash';

import {COMMAND_DEFINITIONS, TOP_LEVEL_COMMANDS} from '../../../constants/commands.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';

// Static list of driver commands, shown only for drivers that do not support
// the listCommands/listExtensions endpoints
const StaticCommandsList = (props) => {
  const {automationName, startPerformingCommand, generateCommandNotes, t} = props;

  return (
    <Space className={inspectorStyles.spaceContainer} direction="vertical" size="middle">
      {t('commandsDescription')}
      <Row>
        {_.toPairs(TOP_LEVEL_COMMANDS).map(([commandName, command], index) => (
          <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
            <div className={styles.btnContainer}>
              <Button onClick={() => startPerformingCommand(commandName, command)}>
                {commandName}
              </Button>
            </div>
          </Col>
        ))}
      </Row>
      <Collapse
        items={_.toPairs(COMMAND_DEFINITIONS).map(([commandGroup, commands]) => ({
          key: commandGroup,
          label: t(commandGroup),
          children: (
            <Row>
              {_.toPairs(commands).map(
                ([commandName, command], index) =>
                  (!command.drivers || command.drivers.includes(automationName)) && (
                    <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
                      <div className={styles.btnContainer}>
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
          ),
        }))}
      />
    </Space>
  );
};

export default StaticCommandsList;
