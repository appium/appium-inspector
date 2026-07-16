import {IconFiles, IconTable} from '@tabler/icons-react';
import {Button, Col, Modal, Row, Space, Tooltip} from 'antd';
import _ from 'lodash';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {copyToClipboard} from '../../../../utils/other.js';
import styles from './CommandResult.module.css';
import CommandResultFormattedTable from './CommandResultFormattedTable.jsx';
import CommandResultRawTable from './CommandResultRawTable.jsx';

const stringifyValue = (val) => (_.isObject(val) ? JSON.stringify(val, null, 2) : String(val));

/**
 * Footer buttons of the modal rendering the command results.
 */
const CommandResultModalFooter = ({
  result,
  closeCommandModal,
  setFormatResult,
  formatResult,
  isPrimitive,
}) => {
  const {t} = useTranslation();

  return (
    <Row>
      <Col span={12}>
        <Space>
          <Tooltip title={t('toggleTableFormatting')}>
            <Button
              icon={<IconTable size={18} />}
              disabled={isPrimitive}
              type={formatResult ? BUTTON.PRIMARY : BUTTON.DEFAULT}
              onClick={() => setFormatResult(!formatResult)}
            />
          </Tooltip>
          <Tooltip title={t('copyResultToClipboard')}>
            <Button
              icon={<IconFiles size={18} />}
              disabled={formatResult}
              onClick={() => copyToClipboard(result)}
            />
          </Tooltip>
        </Space>
      </Col>
      <Col span={12} className={styles.commandResultModalOkButtonCol}>
        <Button onClick={() => closeCommandModal()} type={BUTTON.PRIMARY}>
          {t('OK')}
        </Button>
      </Col>
    </Row>
  );
};

/**
 * Modal rendering the command results.
 */
const CommandResultModal = ({commandName, commandResult, clearCurrentCommand}) => {
  const {t} = useTranslation();
  const [formatResult, setFormatResult] = useState(false);

  const resultType =
    commandResult === null ? 'null' : Array.isArray(commandResult) ? 'array' : typeof commandResult;
  const isPrimitive = resultType !== 'object' && resultType !== 'array';
  const stringifiedResult = stringifyValue(commandResult);

  const closeCommandModal = () => {
    clearCurrentCommand();
    setFormatResult(false);
  };

  return (
    <Modal
      title={t('methodCallResult', {methodName: commandName, resultType})}
      open={commandResult !== undefined}
      onCancel={() => closeCommandModal()}
      width={{md: '80%', lg: '70%', xl: '60%', xxl: '50%'}}
      className={styles.commandResultModal}
      footer={
        <CommandResultModalFooter
          result={stringifiedResult}
          closeCommandModal={closeCommandModal}
          setFormatResult={setFormatResult}
          formatResult={formatResult}
          isPrimitive={isPrimitive}
        />
      }
    >
      {formatResult ? (
        <CommandResultFormattedTable result={commandResult} isPrimitive={isPrimitive} />
      ) : (
        <CommandResultRawTable result={stringifiedResult} />
      )}
    </Modal>
  );
};

export default CommandResultModal;
