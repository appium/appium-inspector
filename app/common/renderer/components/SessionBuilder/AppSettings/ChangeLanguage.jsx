import {Form, Select} from 'antd';
import {useEffect, useState} from 'react';

import {languageList} from '../../../../shared/i18next.config.js';
import {PREFERRED_LANGUAGE} from '../../../../shared/setting-defs.js';
import i18n from '../../../i18next.js';
import {setSetting} from '../../../polyfills.js';

const ChangeLanguage = ({t}) => {
  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    const handler = (lng) => setLanguage(lng);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  const languageOptions = languageList.map((language) => ({
    value: language.code,
    label: `${language.name} (${language.original})`,
  }));

  const handleLanguageChange = async (val) => {
    setLanguage(val);
    await i18n.changeLanguage(val);
    await setSetting(PREFERRED_LANGUAGE, val);
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
