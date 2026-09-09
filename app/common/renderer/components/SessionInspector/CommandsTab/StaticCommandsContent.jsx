import {Button, Col, Collapse, Row, Space} from 'antd';
import {useTranslation} from 'react-i18next';

import {COMMAND_DEFINITIONS, COMMANDS_GRID_BREAKPOINTS, TOP_LEVEL_COMMANDS} from '../../../constants/commands.js';

import inspectorStyles from '../SessionInspector.module.css';
import styles from './Commands.module.css';

/**
 * Button rows used for the static list of driver commands.
 */
const StaticCommandsRow = ({btnColspan, startCommand, commands}) => (
  <Row>
    {Object.entries(commands).map(([cmdName, cmdDetails]) => (
      <Col key={cmdName} span={btnColspan}>
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
      items={Object.entries(COMMAND_DEFINITIONS).map(([commandGroup, commands]) => ({
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
const StaticCommandsContent = ({getBtnColspan, startCommand}) => {
  const {t} = useTranslation();

  const btnColspan = getBtnColspan(COMMANDS_GRID_BREAKPOINTS);

  return (
    <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
      {t('commandsDescription')}
      <StaticCommandsRow btnColspan={btnColspan} startCommand={startCommand} commands={TOP_LEVEL_COMMANDS} />
      <StaticCommandsCollapseGroups startCommand={startCommand} />
    </Space>
  );
};

export default StaticCommandsContent;
