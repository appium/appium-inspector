import {Table, Tooltip} from 'antd';
import {useState} from 'react';

import {copyToClipboard} from '../../../polyfills.js';
import styles from './Commands.module.css';

const isTimestampKey = (key) => key === 'timestamp';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(timestamp - offset);
  return localDate.toISOString().slice(0, -1);
};

const formatValueWithTimestamp = (value, key = null) =>
  isTimestampKey(key) ? formatTimestamp(value) : value;

const ClickableCellContent = ({text, dataIndex}) => {
  const [isCopied, setIsCopied] = useState(false);
  const displayText = String(formatValueWithTimestamp(text, dataIndex));

  const handleCopy = async () => {
    await copyToClipboard(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Tooltip placement="topLeft" title={isCopied ? 'Copied' : 'Click to copy'}>
      <pre className={styles['clickable-cell']} onClick={handleCopy}>
        {displayText}
      </pre>
    </Tooltip>
  );
};

const CommandResultTable = ({result}) => {
  const createColumn = (data, dataIndex, options = {}) => ({
    title: dataIndex,
    dataIndex,
    key: dataIndex,
    ellipsis: {showTitle: false},
    render: (text) => <ClickableCellContent text={text} dataIndex={dataIndex} />,
    sorter: (a, b) =>
      formatValueWithTimestamp(a[dataIndex], dataIndex).localeCompare(
        formatValueWithTimestamp(b[dataIndex], dataIndex),
        undefined,
        {numeric: true},
      ),
    filters: data.map((item) => ({
      text: item[dataIndex],
      value: item[dataIndex],
    })),
    onFilter: (value, record) => record[dataIndex] === value,
    ...options,
  });

  const handlePrimitiveData = (data) => {
    const flattenedData = [{value: formatValueWithTimestamp(data)}];
    const columns = [createColumn(flattenedData, 'value', {minWidth: 120})];
    return {flattenedData, columns};
  };

  const handleObjectData = (data) => {
    const flattenedData = Object.entries(data).map(([key, value]) => ({
      property: key,
      value:
        typeof value === 'object'
          ? JSON.stringify(value, null, 2)
          : formatValueWithTimestamp(value, key),
    }));
    const columns = [
      createColumn(flattenedData, 'property', {width: '30%', minWidth: 120}),
      createColumn(flattenedData, 'value', {width: '70%', minWidth: 200}),
    ];
    return {flattenedData, columns};
  };

  const handleArrayOfPrimitives = (data) => {
    const flattenedData = data.map((item) => ({value: formatValueWithTimestamp(item)}));
    const columns = [createColumn(flattenedData, 'value', {minWidth: 120})];
    return {flattenedData, columns};
  };

  const handleArrayOfObjects = (data) => {
    const columns = [...new Set(data.flatMap(Object.keys))].map((key) =>
      createColumn(data, key, {minWidth: 100}),
    );
    return {flattenedData: data, columns};
  };

  const createTableResult = (data) => {
    let result;

    if (Array.isArray(data)) {
      if (typeof data[0] === 'object') {
        result = handleArrayOfObjects(data);
      } else {
        result = handleArrayOfPrimitives(data);
      }
    } else if (typeof data === 'object') {
      const keys = Object.keys(data);
      if (keys.length === 1) {
        return createTableResult(data[keys[0]]);
      }
      result = handleObjectData(data);
    } else {
      result = handlePrimitiveData(data);
    }

    const dataSource = result.flattenedData.map((item, index) => ({
      key: index.toString(),
      ...item,
    }));

    return {dataSource, columns: result.columns};
  };

  const formatCommandResultForTable = (result) => {
    if (!result) {
      return null;
    }

    const parsedResult = JSON.parse(result);

    return createTableResult(parsedResult);
  };

  const tableData = formatCommandResultForTable(result);

  if (!tableData) {
    return <div>No data to display</div>;
  }

  return (
    <Table
      dataSource={tableData.dataSource}
      columns={tableData.columns}
      pagination={false}
      size="small"
      scroll={{y: 400, x: 'max-content'}}
      bordered
      tableLayout="auto"
      className={styles['command-result-table']}
    />
  );
};

export default CommandResultTable;
