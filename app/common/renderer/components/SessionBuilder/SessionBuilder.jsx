import {LinkOutlined} from '@ant-design/icons';
import {Badge, Button, Divider, Space, Spin, Tabs} from 'antd';
import _ from 'lodash';
import {useEffect} from 'react';
import {useNavigate} from 'react-router';

import {BUTTON} from '../../constants/antd-types.js';
import {LINKS} from '../../constants/common.js';
import {
  ADD_CLOUD_PROVIDER_TAB_KEY,
  SERVER_TYPES,
  SESSION_BUILDER_TABS,
} from '../../constants/session-builder.js';
import {ipcRenderer, openLink} from '../../polyfills.js';
import {log} from '../../utils/logger.js';
import AttachToSession from './AttachToSessionTab/AttachToSession.jsx';
import CapabilityEditor from './CapabilityBuilderTab/CapabilityEditor.jsx';
import SavedCapabilitySets from './SavedCapabilitySetsTab/SavedCapabilitySets.jsx';
import AdvancedServerParams from './ServerDetails/AdvancedServerParams.jsx';
import CloudProviders from './ServerDetails/CloudProviders.jsx';
import CloudProviderSelector from './ServerDetails/CloudProviderSelector.jsx';
import ServerTabCustom from './ServerDetails/ServerTabCustom.jsx';
import styles from './SessionBuilder.module.css';
import ToggleTheme from './Settings/ToggleTheme.jsx';

const Session = (props) => {
  const {
    tabKey,
    switchTabs,
    serverType,
    server,
    visibleProviders = [],
    caps,
    capsUUID,
    capsName,
    isCapsDirty,
    isEditingDesiredCaps,
    requestSaveAsModal,
    saveSession,
    newSession,
    savedSessions,
    newSessionLoading,
    attachSessId,
    t,
  } = props;

  const navigate = useNavigate();

  const isAttaching = tabKey === 'attach';

  const handleSelectServerTab = async (tab) => {
    const {changeServerType, addCloudProvider} = props;
    if (tab === ADD_CLOUD_PROVIDER_TAB_KEY) {
      addCloudProvider();
      return;
    }
    await changeServerType(tab);
  };

  const loadNewSession = async (caps, attachSessId = null) => {
    if (await newSession(_.cloneDeep(caps), attachSessId)) {
      navigate('/inspector', {replace: true});
    }
  };

  useEffect(() => {
    const {
      setLocalServerParams,
      getSavedSessions,
      setSavedServerParams,
      initFromSessionFile,
      setStateFromSessionFile,
      setVisibleProviders,
      bindWindowClose,
      initFromQueryString,
      saveSessionAsFile,
    } = props;
    (async () => {
      try {
        bindWindowClose();
        switchTabs(SESSION_BUILDER_TABS.CAPS_BUILDER);
        await getSavedSessions();
        await setVisibleProviders();
        await setSavedServerParams();
        await setLocalServerParams();
        initFromQueryString(loadNewSession);
        await initFromSessionFile();
        ipcRenderer.on('sessionfile:apply', (_, sessionFileString) =>
          setStateFromSessionFile(sessionFileString),
        );
        ipcRenderer.on('sessionfile:download', () => saveSessionAsFile());
      } catch (e) {
        log.error(e);
      }
    })();
  }, []);

  return [
    <Spin spinning={!!newSessionLoading} key="main">
      <div className={styles.sessionContainer}>
        <div className={styles.sessionHeader}>
          <Tabs
            activeKey={serverType}
            onChange={(tab) => handleSelectServerTab(tab)}
            className={styles.serverTabs}
            items={[
              {
                label: t('Appium Server'),
                key: SERVER_TYPES.REMOTE,
                children: <ServerTabCustom {...props} />,
              },
              ..._(visibleProviders).map((providerName) => {
                const provider = CloudProviders[providerName];
                if (!provider) {
                  return true;
                }
                return {
                  label: <div>{provider.tabhead()}</div>,
                  key: providerName,
                  children: provider.tab(props),
                };
              }),
              {
                label: <span className="addCloudProviderTab">{t('Select Cloud Providers')}</span>,
                key: ADD_CLOUD_PROVIDER_TAB_KEY,
              },
            ]}
          />
          <ToggleTheme {...props} />
        </div>
        <AdvancedServerParams {...props} />
        <Tabs
          activeKey={tabKey}
          onChange={switchTabs}
          className={styles.scrollingTabCont}
          items={[
            {
              label: t('Capability Builder'),
              key: SESSION_BUILDER_TABS.CAPS_BUILDER,
              className: styles.scrollingTab,
              children: <CapabilityEditor {...props} />,
            },
            {
              label: (
                <span>
                  {t('Saved Capability Sets')}{' '}
                  <Badge count={savedSessions.length} offset={[0, -3]} />
                </span>
              ),
              key: SESSION_BUILDER_TABS.SAVED_CAPS,
              className: styles.scrollingTab,
              disabled: savedSessions.length === 0,
              children: <SavedCapabilitySets {...props} />,
            },
            {
              label: t('Attach to Session'),
              key: SESSION_BUILDER_TABS.ATTACH_TO_SESSION,
              className: styles.scrollingTab,
              children: <AttachToSession {...props} />,
            },
          ]}
        />
        <Divider />
        <div className={styles.sessionFooter}>
          <div className={styles.desiredCapsLink}>
            <a href="#" onClick={(e) => e.preventDefault() || openLink(LINKS.CAPS_DOCS)}>
              <LinkOutlined />
              &nbsp;
              {t('desiredCapabilitiesDocumentation')}
            </a>
          </div>
          {!isAttaching && (
            <Space.Compact>
              {capsUUID && (
                <Button
                  onClick={() =>
                    saveSession(server, serverType, caps, {name: capsName, uuid: capsUUID})
                  }
                  disabled={!isCapsDirty || isEditingDesiredCaps}
                >
                  {t('Save')}
                </Button>
              )}
              <Button onClick={requestSaveAsModal} disabled={isEditingDesiredCaps}>
                {t('saveAs')}
              </Button>
            </Space.Compact>
          )}
          {!isAttaching && (
            <Button
              type={BUTTON.PRIMARY}
              id="btnStartSession"
              disabled={isEditingDesiredCaps}
              onClick={() => loadNewSession(caps)}
              className={styles.startSessionBtn}
            >
              {t('startSession')}
            </Button>
          )}
          {isAttaching && (
            <Button
              type={BUTTON.PRIMARY}
              disabled={!attachSessId}
              onClick={() => loadNewSession(null, attachSessId)}
            >
              {t('attachToSession')}
            </Button>
          )}
        </div>
      </div>
    </Spin>,
    <CloudProviderSelector {...props} key="CloudProviderSelector" />,
  ];
};

export default Session;
