import {Flex, Form, Switch} from 'antd';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';

import {PREFER_SOURCE_FIRST} from '../../../../shared/setting-defs.js';
import {getSetting, setSetting} from '../../../polyfills.js';

let retrievedPreference = await getSetting(PREFER_SOURCE_FIRST);

/**
 * Options for customizing the source/screenshot refresh behavior.
 */
const RefreshOptions = () => {
  const {t} = useTranslation();
  const [preferSourceFirst, setPreferSourceFirst] = useState(retrievedPreference);
  const orderLabel = t('requestPageSourceBeforeScreenshot');

  const changeRefreshOrder = async (checked) => {
    await setSetting(PREFER_SOURCE_FIRST, checked);
    retrievedPreference = checked;
    setPreferSourceFirst(checked);
  };

  return (
    <Form.Item styles={{root: {marginBottom: '8px'}}} label={t('refreshOptions')}>
      <Flex gap={4} justify="space-evenly">
        {orderLabel}
        <Switch aria-label={orderLabel} checked={preferSourceFirst} onChange={changeRefreshOrder} />
      </Flex>
    </Form.Item>
  );
};

export default RefreshOptions;
