import {Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {copyToClipboard} from '../../../../utils/other.js';
import styles from './CommandResult.module.css';
import CommandResultBaseTable from './CommandResultBaseTable.jsx';

const LABEL_PROPERTY = 'property';
const LABEL_VALUE = 'value';

const stringifyValue = (val) =>
  typeof val === 'object' && val !== null ? JSON.stringify(val, null, 2) : String(val);

/**
 * Title of a column in the table rendering the formatted command results.
 */
const CommandResultColumnTitle = ({colName}) => {
  const {t} = useTranslation();

  if (colName === LABEL_PROPERTY) {
    return t('Property');
  }
  if (colName === LABEL_VALUE) {
    return t('Value');
  }
  return colName;
};

/**
 * Single cell in the table rendering the formatted command results.
 */
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

// Specify properties for each column
const createColumn = (colDataArray, colName, options = {}) => ({
  title: <CommandResultColumnTitle colName={colName} />,
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
    .filter((item) => !(typeof item === 'object' && item !== null))
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
  const safeData = data.filter(
    (entry) => typeof entry === 'object' && entry !== null && !Array.isArray(entry),
  );
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
    if (typeof data[0] === 'object' && data[0] !== null && !Array.isArray(data[0])) {
      tableContents = handleArrayOfObjects(data);
    } else {
      tableContents = handleArrayOfNonObjects(data);
    }
  } else if (typeof data === 'object' && data !== null) {
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

/**
 * Table rendering the formatted command results.
 */
const CommandResultFormattedTable = ({result, isPrimitive}) => {
  const {dataSource, columns} = createTableResult(result);

  return (
    <CommandResultBaseTable dataSource={dataSource} columns={columns} showHeader={!isPrimitive} />
  );
};

export default CommandResultFormattedTable;
