import {Button, Col, Collapse, Row, Space} from 'antd';
import _ from 'lodash';

import {COMMAND_DEFINITIONS, TOP_LEVEL_COMMANDS} from '../../../constants/commands.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';

// Static list of driver commands, shown only for drivers that do not support
// the listCommands/listExtensions endpoints
const StaticCommandsList = (props) => {
  const {startPerformingCommand, t} = props;

  return (
    <Space className={inspectorStyles.spaceContainer} direction="vertical" size="middle">
      {t('commandsDescription')}
      <Row>
        {_.toPairs(TOP_LEVEL_COMMANDS).map(([commandName, commandProps], index) => (
          <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
            <div className={styles.btnContainer}>
              <Button onClick={() => startPerformingCommand(commandName, commandProps)}>
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
              {_.toPairs(commands).map(([commandName, commandProps], index) => (
                <Col key={index} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
                  <div className={styles.btnContainer}>
                    <Button onClick={() => startPerformingCommand(commandName, commandProps)}>
                      {commandName}
                    </Button>
                  </div>
                </Col>
              ))}
            </Row>
          ),
        }))}
      />
    </Space>
  );
};

export default StaticCommandsList;
