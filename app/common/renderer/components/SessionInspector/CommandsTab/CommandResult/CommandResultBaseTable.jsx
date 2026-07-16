import {Table} from 'antd';

import styles from './CommandResult.module.css';

/**
 * Base table template used to render the command results.
 */
const CommandResultBaseTable = ({dataSource, columns, showHeader}) => (
  <Table
    dataSource={dataSource}
    columns={columns}
    pagination={false}
    size="small"
    scroll={{y: 350, x: 'max-content'}}
    bordered
    showHeader={showHeader}
    tableLayout="auto" // required for minWidth
    className={styles.commandResultTable}
  />
);

export default CommandResultBaseTable;
