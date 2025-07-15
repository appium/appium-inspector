import {CopyOutlined} from '@ant-design/icons';
import {Alert, Button, Tooltip} from 'antd';

import {ALERT} from '../../constants/antd-types';
import {LINKS} from '../../constants/common';
import {withTranslation} from '../../i18next';
import {openLink} from '../../polyfills';
import styles from './ErrorMessage.module.css';

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
          <a onClick={(e) => e.preventDefault() || openLink(LINKS.CREATE_ISSUE)}>
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
