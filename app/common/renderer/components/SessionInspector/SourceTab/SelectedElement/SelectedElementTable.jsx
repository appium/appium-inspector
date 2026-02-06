import {Row, Table} from 'antd';

import styles from '../Source.module.css';

/**
 * Generic table component for displaying selected element data.
 */
const SelectedElementTable = ({columns, dataSource}) => (
  <Row className={styles.selectedElemTableWrapper}>
    <Table
      columns={columns}
      dataSource={dataSource}
      size="small"
      scroll={{x: 'max-content'}}
      pagination={false}
    />
  </Row>
);

export default SelectedElementTable;
