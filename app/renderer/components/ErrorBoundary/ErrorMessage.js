import {CopyOutlined} from '@ant-design/icons';
import {Alert, Button, Tooltip} from 'antd';
import React from 'react';

import {ALERT} from '../../constants/antd-types';
import {LINKS} from '../../constants/common';
import {shell} from '../../polyfills';
import {withTranslation} from '../../utils/other';
import styles from './ErrorMessage.css';

const ErrorMessage = ({error, copyTrace, t}) => (
  <div className={styles.errorMessage}>
    <Alert
      message={
        <>
          {t('Unexpected Error:')} <code>{error.message}</code>
        </>
      }
      type={ALERT.ERROR}
      showIcon
      description={
        <>
          {t('Please report this issue at:')}&nbsp;
          <a onClick={(e) => e.preventDefault() || shell.openExternal(LINKS.CREATE_ISSUE)}>
            {LINKS.CREATE_ISSUE}
          </a>
          <br />
          {t('Full error trace:')}
          <Tooltip title={t('Copy Error Trace')}>
            <Button
              size="small"
              className={styles.copyTraceBtn}
              onClick={copyTrace(error.stack)}
              icon={<CopyOutlined />}
            />
          </Tooltip>
          <pre>{error.stack}</pre>
        </>
      }
    />
  </div>
);

export default withTranslation(ErrorMessage);
