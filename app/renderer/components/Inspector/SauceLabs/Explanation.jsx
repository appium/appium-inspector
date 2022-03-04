import React from 'react';
import { Alert, Card } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import styles from './Explanation.css';

const Explanation = () => {
  return (
    <Card
      title={
        <span>
          <WarningOutlined /> Important information
        </span>
      }
      className={styles.innerExplanationContainer}
    >
      <div>
        <Alert
          message="You are watching the live video recording"
          type="info"
          showIcon
        />
      </div>
    </Card>
  );
};

export default Explanation;
