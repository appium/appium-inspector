import {IconMoon, IconSun, IconSunMoon} from '@tabler/icons-react';
import {Button, Col, Form, Row} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {useTheme} from '../../../hooks/use-theme.jsx';

const ToggleTheme = () => {
  const {preferredTheme, updateTheme} = useTheme();
  const {t} = useTranslation();

  const themes = [
    {
      value: 'light',
      label: t('Light Theme'),
      icon: <IconSun size={16} />,
    },
    {
      value: 'dark',
      label: t('Dark Theme'),
      icon: <IconMoon size={16} />,
    },
    {
      value: 'system',
      label: t('System Theme'),
      icon: <IconSunMoon size={16} />,
    },
  ];

  return (
    <Form.Item label={t('Theme')}>
      <Row gutter={6}>
        {themes.map(({value, label, icon}) => (
          <Col span={8} key={value}>
            <Button
              block
              styles={{root: {height: 'max(40px, 100%)', whiteSpace: 'normal'}}}
              size={'large'}
              type={preferredTheme === value ? BUTTON.PRIMARY : BUTTON.DEFAULT}
              icon={icon}
              onClick={() => updateTheme(value)}
            >
              {label}
            </Button>
          </Col>
        ))}
      </Row>
    </Form.Item>
  );
};

export default ToggleTheme;
