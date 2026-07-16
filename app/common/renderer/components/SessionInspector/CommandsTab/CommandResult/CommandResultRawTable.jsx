import styles from './CommandResult.module.css';
import CommandResultBaseTable from './CommandResultBaseTable.jsx';

/**
 * Table rendering the raw command results.
 */
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

  return <CommandResultBaseTable dataSource={dataSource} columns={columns} showHeader={false} />;
};

export default CommandResultRawTable;
