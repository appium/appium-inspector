import React, { memo } from 'react';
import { Alert, Card } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import styles from './Explanation.css';

/**
 *
 * @param {object} translation
 */
const Explanation = memo(({ translation }) => {
  return (
    <Card
      title={
        <span>
          <WarningOutlined /> {translation('sauceExplanationImportant')}
        </span>
      }
      className={styles.innerExplanationContainer}
    >
      <div>
        <Alert
          message={translation('sauceExplanationInfo')}
          type="info"
          showIcon
        />
        <span className={styles.text}>
          {translation('sauceExplanationIssues')}
          <ul>
            <li>{translation('sauceExplanationIssuesList1')}</li>
            <li>{translation('sauceExplanationIssuesList2')}</li>
            <li>{translation('sauceExplanationIssuesList3')}</li>
            <li>{translation('sauceExplanationIssuesList4')}</li>
          </ul>
          {translation('sauceExplanationIssuesPart2')}
        </span>
      </div>
    </Card>
  );
});

export default Explanation;
