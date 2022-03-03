import React from 'react';
import { Alert, Card } from 'antd';
import { InfoOutlined } from '@ant-design/icons';
import styles from './Explanation.css';

const Explanation = () => {
  return (
    <Card
      title={
        <span>
          <InfoOutlined /> Important information
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
