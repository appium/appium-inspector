import {BgColorsOutlined, MoonOutlined, SunOutlined} from '@ant-design/icons';
import {Button, Dropdown, Tooltip} from 'antd';

import {useTheme} from '../../hooks/use-theme';
import SessionStyles from './Session.module.css';

const ToggleTheme = ({t}) => {
  const {preferredTheme, updateTheme} = useTheme();

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
      icon: <BgColorsOutlined />,
    },
  ];

  return (
    <div className={SessionStyles.toggleTheme}>
      <Tooltip title={t('Toggle Theme')}>
        <Dropdown
          menu={{
            items: themes,
            selectable: true,
            selectedKeys: [preferredTheme],
            onSelect: ({key}) => {
              updateTheme(key);
            },
          }}
          trigger={['click']}
        >
          <Button
            icon={themes.find((t) => t.key === preferredTheme)?.icon || <BgColorsOutlined />}
          />
        </Dropdown>
      </Tooltip>
    </div>
  );
};

export default ToggleTheme;
