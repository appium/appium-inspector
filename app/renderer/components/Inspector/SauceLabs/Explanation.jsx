import React, { memo } from 'react';
import { Alert, Card } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import styles from './Explanation.css';

const Explanation = memo(() => {
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
          message="You are watching the live video streaming of the device that you've selected. You can interact with it as if you would do in Sauce Labs Live/Manual testing."
          type="info"
          showIcon
        />
        <span className={styles.text}>
          Any issues related to the usage of this this screen need to be
          submitted to the Appium Inspector project. Please provide all
          necessary information like:
          <ul>
            <li>Device Name</li>
            <li>OS version</li>
            <li>Mobile app or browser</li>
            <li>Data Center (US/EU)</li>
          </ul>
          Also mention clearly in the title and description that you are facing
          an issue on this screen.
        </span>
      </div>
    </Card>
  );
});

export default Explanation;
