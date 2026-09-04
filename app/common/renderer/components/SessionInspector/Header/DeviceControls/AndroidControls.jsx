import {IconChevronLeft, IconCircle, IconSquare} from '@tabler/icons-react';
import {Button, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {COMMAND_EXECUTE_SCRIPT} from '../../../../constants/commands.js';

/**
 * Device controls used for Android sessions.
 */
const AndroidControls = ({applyClientMethod}) => {
  const {t} = useTranslation();
  const backLabel = t('Press Back Button');
  const homeLabel = t('Press Home Button');
  const appSwitchLabel = t('Press App Switch Button');

  return (
    <Space.Compact>
      <Tooltip title={backLabel}>
        <Button
          aria-label={backLabel}
          id="btnPressBackButton"
          icon={<IconChevronLeft size={20} />}
          onClick={() =>
            applyClientMethod({
              methodName: COMMAND_EXECUTE_SCRIPT,
              args: ['mobile:pressKey', [{keycode: 4}]],
            })
          }
        />
      </Tooltip>
      <Tooltip title={homeLabel}>
        <Button
          aria-label={homeLabel}
          id="btnPressHomeButton"
          icon={<IconCircle size={16} />}
          onClick={() =>
            applyClientMethod({
              methodName: COMMAND_EXECUTE_SCRIPT,
              args: ['mobile:pressKey', [{keycode: 3}]],
            })
          }
        />
      </Tooltip>
      <Tooltip title={appSwitchLabel}>
        <Button
          aria-label={appSwitchLabel}
          id="btnPressAppSwitchButton"
          icon={<IconSquare size={16} />}
          onClick={() =>
            applyClientMethod({
              methodName: COMMAND_EXECUTE_SCRIPT,
              args: ['mobile:pressKey', [{keycode: 187}]],
            })
          }
        />
      </Tooltip>
    </Space.Compact>
  );
};

export default AndroidControls;
