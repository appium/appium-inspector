import React from 'react';
import { Alert, Button, Tooltip } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import styles from './ErrorMessage.css';
import { ALERT } from '../AntdTypes';
import { withTranslation } from '../../util';

const CREATE_ISSUE_URL = 'https://github.com/appium/appium-inspector/issues/new/choose';

const ErrorMessage = ({ error, copyTrace, t }) => (
  <div className={styles.errorMessage}>
    <Alert
      message={<>{t('Unexpected Error:')} <code children={error.message} /></>}
      type={ALERT.ERROR}
      showIcon
      description={
        <>
          {t('Please report this issue at:')} <a href={CREATE_ISSUE_URL} children={CREATE_ISSUE_URL} />
          <br />
          {t('Full error trace:')}
          <Tooltip title={t('Copy Error Trace')}>
            <Button
              className={styles.copyTraceBtn}
              onClick={copyTrace(error.stack)}
              icon={<CopyOutlined/>} />
          </Tooltip>
          <pre children={error.stack} />
        </>
      }
    />
  </div>
);

export default withTranslation(ErrorMessage);
