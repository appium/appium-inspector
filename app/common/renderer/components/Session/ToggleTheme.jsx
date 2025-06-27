import {MoonOutlined, SettingOutlined, SunOutlined} from '@ant-design/icons';
import {Dropdown} from 'antd';

import {useTheme} from '../../hooks/use-theme';
import SessionStyles from './Session.module.css';

const ToggleTheme = ({t}) => {
  const {preferredTheme, updatePreferredTheme} = useTheme();

  const themes = [
    {
      key: 'light',
      label: t('Light Theme'),
      icon: <SunOutlined />,
    },
    {
      key: 'dark',
      label: t('Dark Theme'),
      icon: <MoonOutlined />,
    },
    {
      key: 'system',
      label: t('System Theme'),
      icon: <SettingOutlined />,
    },
  ];

  return (
    <div className={SessionStyles.toggleTheme}>
      <Dropdown
        menu={{
          items: themes,
          selectable: true,
          selectedKeys: [preferredTheme],
          onSelect: ({key}) => {
            updatePreferredTheme(key);
          },
        }}
      >
        {themes.find((t) => t.key === preferredTheme)?.icon || <SettingOutlined />}
      </Dropdown>
    </div>
  );
};

export default ToggleTheme;
