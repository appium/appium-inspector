import {Alert} from 'antd';
import {useTranslation} from 'react-i18next';

import {ALERT} from '../../../../constants/antd-types.js';
import {NATIVE_APP} from '../../../../constants/session-inspector.js';

/**
 * Warning message shown when XPath is the only optimal locator strategy for a native element.
 */
const XpathNotRecommendedMessage = ({currentContext, elementLocatorsData}) => {
  const {t} = useTranslation();

  if (currentContext === NATIVE_APP && elementLocatorsData.length === 1) {
    return <Alert title={t('usingXPathNotRecommended')} type={ALERT.WARNING} showIcon />;
  }
};

export default XpathNotRecommendedMessage;
