import React from 'react';
import { Alert } from 'antd';
import styles from './ErrorMessage.css';
import { ALERT } from '../AntdTypes';
import { withTranslation } from '../../util';

const CREATE_ISSUE_URL = 'https://github.com/appium/appium-inspector/issues/new/choose';

const ErrorMessage = ({ error, t }) => (
  <div className={styles.errorMessage}>
    <Alert
      message={<>{t('unexpectedError')} <code children={error.message} /></>}
      type={ALERT.ERROR}
      showIcon
      description={
        <>
          {t('pleaseReportThisIssue')} <a href={CREATE_ISSUE_URL} children={CREATE_ISSUE_URL} />
          <br />
          {t('fullErrorTrace')}
          <pre children={error.stack} />
        </>
      }
    />
  </div>
);

export default withTranslation(ErrorMessage);
