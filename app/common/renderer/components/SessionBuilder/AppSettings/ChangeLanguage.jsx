import {Form, Select} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {languageList} from '../../../../shared/i18next.config.js';
import {PREFERRED_LANGUAGE} from '../../../../shared/setting-defs.js';
import {setSetting, updateLanguage} from '../../../polyfills.js';

const ChangeLanguage = () => {
  const {t, i18n} = useTranslation();
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const handler = (lng) => setLanguage(lng);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, [i18n]);

  const languageOptions = languageList.map((language) => ({
    value: language.code,
    label: `${language.name} (${language.original})`,
  }));

  const handleLanguageChange = async (val) => {
    setLanguage(val);
    await i18n.changeLanguage(val);
    await setSetting(PREFERRED_LANGUAGE, val);
    updateLanguage(val);
  };

  return (
    <Form.Item label={t('Languages')}>
      <Select
        styles={{content: {fontSize: '14px'}, popup: {listItem: {fontSize: '14px'}}}}
        value={language}
        onChange={handleLanguageChange}
        options={languageOptions}
        showSearch={{optionFilterProp: 'label'}}
      />
    </Form.Item>
  );
};

export default ChangeLanguage;
