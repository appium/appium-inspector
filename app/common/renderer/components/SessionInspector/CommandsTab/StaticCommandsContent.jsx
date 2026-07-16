import {Button, Col, Collapse, Row, Space} from 'antd';
import _ from 'lodash';
import {useTranslation} from 'react-i18next';

import {COMMAND_DEFINITIONS, TOP_LEVEL_COMMANDS} from '../../../constants/commands.js';
import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';

/**
 * Button rows used for the static list of driver commands.
 */
const StaticCommandsRow = ({startCommand, commands}) => (
  <Row>
    {_.toPairs(commands).map(([cmdName, cmdDetails]) => (
      <Col key={cmdName} xs={12} sm={12} md={12} lg={8} xl={6} xxl={4}>
        <div className={styles.btnContainer}>
          <Button onClick={() => startCommand({name: cmdName, details: cmdDetails})}>
            <span className={inspectorStyles.monoFont}>{cmdName}</span>
          </Button>
        </div>
      </Col>
    ))}
  </Row>
);

/**
 * Collapse groups used for the static list of driver commands.
 */
const StaticCommandsCollapseGroups = ({startCommand}) => {
  const {t} = useTranslation();

  return (
    <Collapse
      items={_.toPairs(COMMAND_DEFINITIONS).map(([commandGroup, commands]) => ({
        key: commandGroup,
        label: t(commandGroup),
        children: <StaticCommandsRow startCommand={startCommand} commands={commands} />,
      }))}
    />
  );
};

/**
 * Static list of driver commands, shown only for drivers that do not support
 * the listCommands/listExtensions endpoints.
 */
const StaticCommandsContent = ({startCommand}) => {
  const {t} = useTranslation();

  return (
    <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
      {t('commandsDescription')}
      <StaticCommandsRow startCommand={startCommand} commands={TOP_LEVEL_COMMANDS} />
      <StaticCommandsCollapseGroups startCommand={startCommand} />
    </Space>
  );
};

export default StaticCommandsContent;
