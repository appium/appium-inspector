import {IconAppWindow} from '@tabler/icons-react';
import {Button, Dropdown, Tooltip} from 'antd';
import {useEffect, useState} from 'react';
import {useTranslation} from 'react-i18next';

const WebDriverWindowSwitcher = ({applyClientMethod, executeDriverCommand, disabled}) => {
  const {t} = useTranslation();
  const [open, setOpen] = useState(false);
  const [windows, setWindows] = useState(null);
  const label = t('switchWebDriverWindow');

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    const listWindows = async () => {
      try {
        const {commandRes: handles} = await executeDriverCommand({methodName: 'getWindowHandles'});
        if (!Array.isArray(handles)) {
          throw new TypeError('Expected a list of window handles');
        }
        if (!active) {
          return;
        }
        const current = handles.length
          ? await executeDriverCommand({methodName: 'getWindowHandle'}).catch(() => null)
          : null;
        if (active) {
          setWindows({handles, currentHandle: current?.commandRes});
        }
      } catch {
        if (active) {
          setWindows({unavailable: true});
        }
      }
    };
    void listWindows();
    return () => {
      active = false;
    };
  }, [executeDriverCommand, open]);

  let items;
  if (windows?.handles?.length) {
    items = windows.handles.map((handle) => ({
      key: handle,
      label: handle,
      role: 'menuitemradio',
      'aria-checked': handle === windows.currentHandle,
      disabled: handle === windows.currentHandle,
    }));
  } else {
    const message = !windows
      ? 'loadingWebDriverWindows'
      : windows.unavailable
        ? 'unableToListWebDriverWindows'
        : 'noWebDriverWindows';
    items = [{key: 'status', label: t(message), disabled: true}];
  }

  return (
    <Dropdown
      autoFocus
      open={open}
      disabled={disabled}
      trigger={['click']}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setWindows(null);
        }
        setOpen(nextOpen);
      }}
      menu={{
        items,
        selectable: true,
        selectedKeys: windows?.currentHandle == null ? [] : [windows.currentHandle],
        onClick: ({key}) => {
          setOpen(false);
          void applyClientMethod({methodName: 'switchToWindow', args: [key]});
        },
      }}
    >
      <Tooltip title={label}>
        <Button
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          icon={<IconAppWindow size={18} />}
          type={open ? 'primary' : 'default'}
        />
      </Tooltip>
    </Dropdown>
  );
};

export default WebDriverWindowSwitcher;
