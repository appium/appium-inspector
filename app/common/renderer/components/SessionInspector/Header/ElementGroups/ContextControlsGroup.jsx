import {
  IconExclamationCircle,
  IconInfoCircle,
  IconTriangleSquareCircle,
  IconWorld,
} from '@tabler/icons-react';
import {Button, Select, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON} from '../../../../constants/antd-types.js';
import {LINKS} from '../../../../constants/common.js';
import {APP_MODE} from '../../../../constants/session-inspector.js';
import styles from '../Header.module.css';

/**
 * Element (disabled button) used to indicate the lack of additional contexts.
 */
const NoContextsFoundButton = () => {
  const {t} = useTranslation();

  return (
    <Tooltip title={t('noAdditionalContextsFound')} classNames={{root: styles.wideTooltip}}>
      <Button
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
            {t('contextDropdownInfo')}{' '}
            <a onClick={(e) => e.preventDefault() || openLink(LINKS.HYBRID_MODE_DOCS)}>
              {LINKS.HYBRID_MODE_DOCS}
            </a>
          </>
        }
        classNames={{root: styles.wideTooltip}}
      >
        <Button
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

  return (
    <Space.Compact>
      <Tooltip title={t('Native App Mode')}>
        <Button
          icon={<IconTriangleSquareCircle size={18} />}
          onClick={() => selectAppMode(APP_MODE.NATIVE)}
          type={appMode === APP_MODE.NATIVE ? BUTTON.PRIMARY : BUTTON.DEFAULT}
        />
      </Tooltip>
      <Tooltip title={t('Web/Hybrid App Mode')}>
        <Button
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
