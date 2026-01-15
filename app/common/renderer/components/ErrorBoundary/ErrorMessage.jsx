import {IconFiles} from '@tabler/icons-react';
import {Alert, Button, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {ALERT} from '../../constants/antd-types.js';
import {LINKS} from '../../constants/common.js';
import {openLink} from '../../polyfills.js';
import styles from './ErrorMessage.module.css';

const ErrorMessage = ({error, copyTrace}) => {
  const {t} = useTranslation();

  return (
    <div className={styles.errorMessage}>
      <Alert
        title={
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
                onClick={() => copyTrace(error.stack)}
                icon={<IconFiles size={14} />}
              />
            </Tooltip>
            <pre>{error.stack}</pre>
          </>
        }
      />
    </div>
  );
};

export default ErrorMessage;
