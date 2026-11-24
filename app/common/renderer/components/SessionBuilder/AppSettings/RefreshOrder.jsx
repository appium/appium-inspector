import {Form, Switch} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {PREFER_SOURCE_FIRST} from '../../../../shared/setting-defs.js';
import {getSetting, setSetting} from '../../../polyfills.js';

let retrievedPreference = await getSetting(PREFER_SOURCE_FIRST);

/**
 * Lets users choose whether to request the page source before the screenshot.
 */
const RefreshOrder = () => {
  const {t} = useTranslation();
  const [preferSourceFirst, setPreferSourceFirst] = useState(retrievedPreference);
  const label = t('requestPageSourceBeforeScreenshot');

  const changeRefreshOrder = async (checked) => {
    await setSetting(PREFER_SOURCE_FIRST, checked);
    retrievedPreference = checked;
    setPreferSourceFirst(checked);
  };

  return (
    <Form.Item label={label}>
      <Switch aria-label={label} checked={preferSourceFirst} onChange={changeRefreshOrder} />
    </Form.Item>
  );
};

export default RefreshOrder;
