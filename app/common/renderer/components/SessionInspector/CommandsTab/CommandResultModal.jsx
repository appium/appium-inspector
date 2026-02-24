import {IconFiles, IconTable} from '@tabler/icons-react';
import {Button, Col, Modal, Row, Space, Table, Tooltip} from 'antd';
import _ from 'lodash';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {copyToClipboard} from '../../../utils/other.js';
import styles from './Commands.module.css';

const LABEL_PROPERTY = 'property';
const LABEL_VALUE = 'value';

const stringifyValue = (val) => (_.isObject(val) ? JSON.stringify(val, null, 2) : String(val));

const CommandResultTableCell = ({value}) => {
  const {t} = useTranslation();
  const displayText = stringifyValue(value);
  return (
    <Tooltip placement="topLeft" title={t('Copied!')} trigger="click">
      <code className={styles.commandResultTableCell} onClick={() => copyToClipboard(displayText)}>
        {displayText}
      </code>
    </Tooltip>
  );
};

const CommandResultFormattedTable = ({result, isPrimitive}) => {
  const {t} = useTranslation();
  // Specify properties for each column
  const createColumn = (colDataArray, colName, options = {}) => ({
    title:
      colName === LABEL_PROPERTY ? t('Property') : colName === LABEL_VALUE ? t('Value') : colName,
    dataIndex: colName,
    key: colName,
    ellipsis: {showTitle: false},
    render: (value) => <CommandResultTableCell value={value} />,
    sorter: (a, b) => {
      const av = String(a[colName] ?? '');
      const bv = String(b[colName] ?? '');
      return av.localeCompare(bv, undefined, {numeric: true});
    },
    // hide filters for object values, and convert all others to strings to handle booleans
    filters: [...new Set(colDataArray)]
      .filter((item) => !_.isObject(item))
      .map((item) => ({
        text: String(item),
        value: String(item),
      })),
    onFilter: (value, record) => String(record[colName]) === value,
    ...options,
  });

  // Render primitive data: create single row and column.
  // The table header will also be hidden due to `isPrimitive`.
  const handlePrimitiveData = (data) => {
    const flattenedData = [{value: data}];
    const columns = [createColumn([data], LABEL_VALUE, {minWidth: 120})];
    return {flattenedData, columns};
  };

  // Render an object: create 2 columns, one for keys, the other for values
  const handleObjectData = (data) => {
    const flattenedData = Object.entries(data).map(([key, value]) => ({
      property: key,
      value,
    }));
    const columns = [
      createColumn(Object.keys(data), LABEL_PROPERTY, {width: '30%', minWidth: 120}),
      createColumn(Object.values(data), LABEL_VALUE, {width: '70%', minWidth: 200}),
    ];
    return {flattenedData, columns};
  };

  // Render an array of non-objects (primitives or arrays): create a single column
  const handleArrayOfNonObjects = (data) => {
    const flattenedData = data.map((item) => ({value: item}));
    const columns = [createColumn(data, LABEL_VALUE, {minWidth: 120})];
    return {flattenedData, columns};
  };

  // Render array of objects: create a separate column for each key
  // Will not render any non-object entries!
  const handleArrayOfObjects = (data) => {
    // Filter to only objects (excluding arrays) to avoid runtime errors
    const safeData = data.filter((entry) => _.isObject(entry) && !Array.isArray(entry));
    const allObjectKeys = [...new Set(safeData.flatMap(Object.keys))];
    const columns = allObjectKeys.map((key) =>
      createColumn(
        safeData.map((entry) => entry[key]),
        key,
        {minWidth: 100},
      ),
    );
    return {flattenedData: safeData, columns};
  };

  // Render a different type of table depending on the result type
  const createTableResult = (data) => {
    let tableContents;
    if (Array.isArray(data)) {
      if (_.isObject(data[0]) && !Array.isArray(data[0])) {
        tableContents = handleArrayOfObjects(data);
      } else {
        tableContents = handleArrayOfNonObjects(data);
      }
    } else if (_.isObject(data)) {
      tableContents = handleObjectData(data);
    } else {
      tableContents = handlePrimitiveData(data);
    }
    const {flattenedData, columns} = tableContents;
    const dataSource = flattenedData.map((item, index) => ({
      key: index.toString(),
      ...item,
    }));

    return {dataSource, columns};
  };

  const {dataSource, columns} = createTableResult(result);

  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      size="small"
      scroll={{y: 350, x: 'max-content'}}
      bordered
      showHeader={!isPrimitive}
      tableLayout="auto" // required for minWidth
      className={styles.commandResultTable}
    />
  );
};

const CommandResultRawTable = ({result}) => {
  const dataSource = [{key: 0, rawValue: result}];
  const columns = [
    {
      dataIndex: 'rawValue',
      key: 'rawValue',
      minWidth: 120,
      render: (value) => <pre className={styles.commandResultRawPreBlock}>{value}</pre>,
    },
  ];
  return (
    <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      size="small"
      scroll={{y: 350, x: 'max-content'}}
      bordered
      showHeader={false}
      tableLayout="auto" // required for minWidth
      className={styles.commandResultTable}
    />
  );
};

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
