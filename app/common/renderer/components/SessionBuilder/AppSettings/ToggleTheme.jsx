import {BgColorsOutlined, MoonOutlined, SunOutlined} from '@ant-design/icons';
import {Form, Radio} from 'antd';

import {useTheme} from '../../../hooks/use-theme.jsx';

const ToggleTheme = ({t}) => {
  const {preferredTheme, updateTheme} = useTheme();

  const themes = [
    {
      value: 'light',
      label: t('Light Theme'),
      icon: <SunOutlined />,
    },
    {
      value: 'dark',
      label: t('Dark Theme'),
      icon: <MoonOutlined />,
    },
    {
      value: 'system',
      label: t('System Theme'),
      icon: <BgColorsOutlined />,
    },
  ];

  const themeOptions = themes.map((th) => ({
    ...th,
    label: (
      <>
        {th.icon} {th.label}
      </>
    ),
  }));

  return (
    <Form.Item label={t('Theme')}>
      <Radio.Group
        block
        size={'large'}
        value={preferredTheme}
        onChange={(e) => updateTheme(e.target.value)}
        optionType="button"
        buttonStyle="solid"
        options={themeOptions}
      />
    </Form.Item>
  );
};

export default ToggleTheme;
