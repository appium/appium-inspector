import {BulbOutlined} from '@ant-design/icons';
import {Button, Tooltip} from 'antd';

import {useTheme} from '../../hooks/use-theme';

const ToggleTheme = ({t}) => {
  const {toggleTheme} = useTheme();

  return (
    <Tooltip title={t('Toggle theme')}>
      <Button id="btnToggleTheme" icon={<BulbOutlined />} onClick={() => toggleTheme()} />
    </Tooltip>
  );
};

export default ToggleTheme;
