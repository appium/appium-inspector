import {IconExclamationCircle, IconInfoCircle, IconTriangleSquareCircle, IconWorld} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../constants/antd-types.js';
import {LINKS} from '../../../constants/common.js';
import {APP_MODE} from '../../../constants/session-inspector.js';

import styles from './Header.module.css';

/**
 * Element (disabled button) used to indicate the lack of additional contexts.
 */
const NoContextsFoundButton = () => {
  const {t} = useTranslation();
  const noContextsLabel = t('noAdditionalContextsFound');

  return (
    <Tooltip title={noContextsLabel} classNames={{root: styles.wideTooltip}}>
      <Button
        aria-label={noContextsLabel}
        disabled
        icon={<IconExclamationCircle size={20} />}
        styles={{root: {backgroundColor: '#faad14', color: '#ffffff'}}}
      />
    </Tooltip>
  );
};

/**
 * Dropdown used to switch contexts.
 */
const ContextDropdown = ({contexts, currentContext, setContext, applyClientMethod, openLink}) => {
  const {t} = useTranslation();
  const contextLabel = t('contextDropdownInfo');

  return (
    <>
      <Select
        styles={{root: {width: 350}}}
        value={currentContext}
        popupMatchSelectWidth={false}
        onChange={(value) => {
          setContext(value);
          applyClientMethod({methodName: 'switchAppiumContext', args: [value]});
        }}
        options={contexts.map(({id, title}) => ({
          value: id,
          label: title ? `${title} (${id})` : id,
        }))}
      />
      <Tooltip
        title={
          <>
            {contextLabel}{' '}
            <a onClick={(e) => e.preventDefault() || openLink(LINKS.HYBRID_MODE_DOCS)}>{LINKS.HYBRID_MODE_DOCS}</a>
          </>
        }
        classNames={{root: styles.wideTooltip}}
      >
        <Button
          aria-label={`${contextLabel} ${LINKS.HYBRID_MODE_DOCS}`}
          disabled
          icon={<IconInfoCircle size={20} />}
          styles={{root: {backgroundColor: 'var(--ant-color-primary)', color: '#ffffff'}}}
        />
      </Tooltip>
    </>
  );
};

/**
 * Controls used to switch contexts.
 */
const ContextControlsGroup = ({
  selectAppMode,
  appMode,
  contexts,
  currentContext,
  setContext,
  applyClientMethod,
  openLink,
}) => {
  const {t} = useTranslation();
  const nativeModeLabel = t('Native App Mode');
  const webModeLabel = t('Web/Hybrid App Mode');

  return (
    <Space.Compact>
      <Tooltip title={nativeModeLabel}>
        <Button
          aria-label={nativeModeLabel}
          icon={<IconTriangleSquareCircle size={18} />}
          onClick={() => selectAppMode(APP_MODE.NATIVE)}
          type={appMode === APP_MODE.NATIVE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      <Tooltip title={webModeLabel}>
        <Button
          aria-label={webModeLabel}
          icon={<IconWorld size={18} />}
          onClick={() => selectAppMode(APP_MODE.WEB_HYBRID)}
          type={appMode === APP_MODE.WEB_HYBRID ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      {contexts && contexts.length === 1 && <NoContextsFoundButton />}
      {contexts && contexts.length > 1 && (
        <ContextDropdown
          contexts={contexts}
          currentContext={currentContext}
          setContext={setContext}
          applyClientMethod={applyClientMethod}
          openLink={openLink}
        />
      )}
    </Space.Compact>
  );
};

export default ContextControlsGroup;
