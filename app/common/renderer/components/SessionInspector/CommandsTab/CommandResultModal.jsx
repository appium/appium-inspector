import {Modal, Table, Tooltip} from 'antd';
import _ from 'lodash';

import {copyToClipboard} from '../../../polyfills.js';
import styles from './Commands.module.css';

const parseCommandResult = (result) => {
  if (_.isNil(result)) {
    return {parsedResult: result, isPrimitive: true};
  }
  const parsedResult = JSON.parse(result);
  return {parsedResult, isPrimitive: typeof parsedResult !== 'object'};
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

const CommandResultTable = ({result, t}) => {
  const {parsedResult, isPrimitive} = parseCommandResult(result);

  // Specify properties for each column
  const createColumn = (data, dataIndex, options = {}) => ({
    title: dataIndex,
    dataIndex,
    key: dataIndex,
    ellipsis: {showTitle: false},
    render: (value) => <CommandResultTableCell value={value} t={t} />,
    sorter: (a, b) =>
      a[dataIndex].toString().localeCompare(b[dataIndex].toString(), undefined, {numeric: true}),
    filters: data.map((item) => ({
      text: item[dataIndex],
      value: item[dataIndex],
    })),
    onFilter: (value, record) => record[dataIndex] === value,
    ...options,
  });

  // Render primitive data: create single row and column.
  // The table header will also be hidden due to `isPrimitive`.
  const handlePrimitiveData = (data) => {
    const flattenedData = [{value: data}];
    const columns = [createColumn(flattenedData, 'value', {minWidth: 120})];
    return {flattenedData, columns};
  };

  // Render an object: create 2 columns, one for keys, the other for values
  const handleObjectData = (data) => {
    const flattenedData = Object.entries(data).map(([key, value]) => ({
      property: key,
      value: typeof value === 'object' ? JSON.stringify(value, null, 2) : value,
    }));
    const columns = [
      createColumn(flattenedData, 'property', {width: '30%', minWidth: 120}),
      createColumn(flattenedData, 'value', {width: '70%', minWidth: 200}),
    ];
    return {flattenedData, columns};
  };

  // Render an array of non-objects (primitives or arrays): create a single column
  const handleArrayOfNonObjects = (data) => {
    const flattenedData = data.map((item) => ({value: item}));
    const columns = [createColumn(flattenedData, 'value', {minWidth: 120})];
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
    let result;
    if (Array.isArray(data)) {
      if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
        result = handleArrayOfObjects(data);
      } else {
        result = handleArrayOfNonObjects(data);
      }
    } else if (typeof data === 'object') {
      result = handleObjectData(data);
    } else {
      result = handlePrimitiveData(data);
    }
    const {flattenedData, columns} = result;
    const dataSource = flattenedData.map((item, index) => ({
      key: index.toString(),
      ...item,
    }));

    return {dataSource, columns};
  };

  const {dataSource, columns} = createTableResult(parsedResult);

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

const CommandResult = ({
  visibleCommandMethod,
  visibleCommandResult,
  setVisibleCommandResult,
  t,
}) => (
  <Modal
    title={t('methodCallResult', {methodName: visibleCommandMethod})}
    open={!!visibleCommandResult}
    onOk={() => setVisibleCommandResult(null)}
    onCancel={() => setVisibleCommandResult(null)}
    width={{md: '80%', lg: '70%', xl: '60%', xxl: '50%'}}
  >
    <CommandResultTable result={visibleCommandResult} t={t} />
  </Modal>
);

export default CommandResult;
