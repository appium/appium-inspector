import {CopyOutlined, TableOutlined} from '@ant-design/icons';
import {Button, Col, Modal, Row, Space, Table, Tooltip} from 'antd';
import _ from 'lodash';
import {useState} from 'react';

import {BUTTON} from '../../../constants/antd-types.js';
import {copyToClipboard} from '../../../polyfills.js';
import styles from './Commands.module.css';

const LABEL_PROPERTY = 'property';
const LABEL_VALUE = 'value';

// Parse result as JSON (if possible) and detect whether it is a primitive type
const parseCommandResult = (result) => {
  try {
    const parsedResult = JSON.parse(result);
    const isPrimitive = parsedResult === null || typeof parsedResult !== 'object';
    return {parsedResult, isPrimitive};
  } catch {
    return {parsedResult: result, isPrimitive: true};
  }
};

const CommandResultTableCell = ({value, t}) => {
  const displayText = String(value).trim();

  return (
    <Tooltip placement="topLeft" title={t('Copied!')} trigger="click">
      <code className={styles.commandResultTableCell} onClick={() => copyToClipboard(displayText)}>
        {displayText}
      </code>
    </Tooltip>
  );
};

const CommandResultFormattedTable = ({result, isPrimitive, t}) => {
  // Specify properties for each column
  const createColumn = (data, colName, options = {}) => ({
    title: t(_.capitalize(colName)),
    dataIndex: colName,
    key: colName,
    ellipsis: {showTitle: false},
    render: (value) => <CommandResultTableCell value={value} t={t} />,
    sorter: (a, b) =>
      a[colName].toString().localeCompare(b[colName].toString(), undefined, {numeric: true}),
    filters: data.map((item) => ({
      text: item[colName],
      value: item[colName],
    })),
    onFilter: (value, record) => record[colName] === value,
    ...options,
  });

  // Render primitive data: create single row and column.
  // The table header will also be hidden due to `isPrimitive`.
  const handlePrimitiveData = (data) => {
    const flattenedData = [{value: data}];
    const columns = [createColumn(flattenedData, LABEL_VALUE, {minWidth: 120})];
    return {flattenedData, columns};
  };

  // Render an object: create 2 columns, one for keys, the other for values
  const handleObjectData = (data) => {
    const flattenedData = Object.entries(data).map(([key, value]) => ({
      property: key,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : value,
    }));
    const columns = [
      createColumn(flattenedData, LABEL_PROPERTY, {width: '30%', minWidth: 120}),
      createColumn(flattenedData, LABEL_VALUE, {width: '70%', minWidth: 200}),
    ];
    return {flattenedData, columns};
  };

  // Render an array of non-objects (primitives or arrays): create a single column
  const handleArrayOfNonObjects = (data) => {
    const flattenedData = data.map((item) => ({value: item}));
    const columns = [createColumn(flattenedData, LABEL_VALUE, {minWidth: 120})];
    return {flattenedData, columns};
  };

  // Render array of objects: assume all objects use the same keys,
  // and create a separate column for each key
  const handleArrayOfObjects = (data) => {
    const columns = [...new Set(data.flatMap(Object.keys))].map((key) =>
      createColumn(data, key, {minWidth: 100}),
    );
    return {flattenedData: data, columns};
  };

  // Render a different type of table depending on the result type
  const createTableResult = (data) => {
    let tableContents;
    if (Array.isArray(data)) {
      if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
        tableContents = handleArrayOfObjects(data);
      } else {
        tableContents = handleArrayOfNonObjects(data);
      }
    } else if (typeof data === 'object') {
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
      scroll={{y: 400, x: 'max-content'}}
      bordered
      showHeader={!isPrimitive}
      tableLayout="auto"
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
      scroll={{y: 400, x: 'max-content'}}
      bordered
      showHeader={false}
      className={styles.commandResultTable}
    />
  );
};

const CommandResultModalFooter = ({
  visibleCommandResult,
  closeCommandModal,
  setRenderAsTable,
  renderAsTable,
  isPrimitive,
  t,
}) => (
  <Row>
    <Col span={12}>
      <Space>
        <Tooltip title={t('toggleTableFormatting')}>
          <Button
            icon={<TableOutlined />}
            disabled={isPrimitive}
            type={renderAsTable ? BUTTON.PRIMARY : BUTTON.DEFAULT}
            onClick={() => setRenderAsTable(!renderAsTable)}
          />
        </Tooltip>
        <Tooltip title={t('copyResultToClipboard')}>
          <Button
            icon={<CopyOutlined />}
            disabled={renderAsTable}
            onClick={() => copyToClipboard(visibleCommandResult)}
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

const CommandResult = ({
  visibleCommandMethod,
  visibleCommandResult,
  setVisibleCommandResult,
  t,
}) => {
  const [renderAsTable, setRenderAsTable] = useState(false);

  const {parsedResult, isPrimitive} = parseCommandResult(visibleCommandResult);

  const closeCommandModal = () => {
    setVisibleCommandResult(null);
    setRenderAsTable(false);
  };

  return (
    <Modal
      title={t('methodCallResult', {methodName: visibleCommandMethod})}
      open={!!visibleCommandResult}
      onCancel={() => closeCommandModal()}
      width={{md: '80%', lg: '70%', xl: '60%', xxl: '50%'}}
      className={styles.commandResultModal}
      footer={
        <CommandResultModalFooter
          visibleCommandResult={visibleCommandResult}
          closeCommandModal={closeCommandModal}
          setRenderAsTable={setRenderAsTable}
          renderAsTable={renderAsTable}
          isPrimitive={isPrimitive}
          t={t}
        />
      }
    >
      {renderAsTable ? (
        <CommandResultFormattedTable result={parsedResult} isPrimitive={isPrimitive} t={t} />
      ) : (
        <CommandResultRawTable result={visibleCommandResult} />
      )}
    </Modal>
  );
};

export default CommandResult;
