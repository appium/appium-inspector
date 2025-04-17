import {LinkOutlined} from '@ant-design/icons';
import {Badge, Button, Dropdown, Spin, Tabs} from 'antd';
import _ from 'lodash';
import {useEffect} from 'react';
import {useNavigate} from 'react-router';

import {BUTTON} from '../../constants/antd-types';
import {LINKS} from '../../constants/common';
import {
  ADD_CLOUD_PROVIDER_TAB_KEY,
  SERVER_TYPES,
  SESSION_BUILDER_TABS,
} from '../../constants/session-builder';
import {ipcRenderer, openLink} from '../../polyfills';
import {log} from '../../utils/logger';

import AdvancedServerParams from './AdvancedServerParams.jsx';
import AttachToSession from './AttachToSession.jsx';
import CapabilityEditor from './CapabilityEditor.jsx';
import CloudProviderSelector from './CloudProviderSelector.jsx';
import CloudProviders from './CloudProviders.jsx';
import SavedSessions from './SavedSessions.jsx';
import ServerTabCustom from './ServerTabCustom.jsx';
import SessionStyles from './Session.module.css';

const Session = (props) => {
  const {
    switchTabs,
    serverType,
    setServerType,
    server,
    visibleProviders = [],
    removeVisibleProvider,
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

  const isAttaching = serverType === 'attach';

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

  const getContextMenu = (tabKey) => ({
    items: [
      {
        key: 'closeTab',
        label: t('Close tab'),
        onClick: () => handleCloseTab(tabKey),
        disabled: tabKey === SERVER_TYPES.REMOTE,
      },
    ],
  });

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCloseTab = (tabKey) => {
    if (tabKey !== SERVER_TYPES.REMOTE) {
      removeVisibleProvider(tabKey);
      if (serverType === tabKey) {
        setServerType(SERVER_TYPES.REMOTE);
      }
    }
  };

  useEffect(() => {
    const {
      setLocalServerParams,
      getSavedSessions,
      setSavedServerParams,
      initFromSessionFile,
      setStateFromSessionFile,
      bindWindowClose,
      initFromQueryString,
      saveSessionAsFile,
    } = props;
    (async () => {
      try {
        bindWindowClose();
        switchTabs(SESSION_BUILDER_TABS.CAPS_BUILDER);
        await getSavedSessions();
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
      <div className={SessionStyles.sessionContainer}>
        <div id="serverTypeTabs" className={SessionStyles.serverTab}>
          <Tabs
            activeKey={serverType}
            onChange={(tab) => handleSelectServerTab(tab)}
            className={SessionStyles.serverTabs}
            items={[
              {
                label: t('Appium Server'),
                key: SERVER_TYPES.REMOTE,
                children: <ServerTabCustom {...props} />,
              },
              ..._.map(visibleProviders, (providerName) => {
                const provider = CloudProviders[providerName];
                if (!provider) {
                  return true;
                }
                return {
                  label: (
                    <Dropdown menu={getContextMenu(providerName)} trigger={['contextMenu']}>
                      <div onContextMenu={(e) => handleContextMenu(e)}>{provider.tabhead()}</div>
                    </Dropdown>
                  ),
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
          <AdvancedServerParams {...props} />
        </div>

        <Tabs
          activeKey={serverType}
          onChange={switchTabs}
          className={SessionStyles.scrollingTabCont}
          items={[
            {
              label: t('Capability Builder'),
              key: SESSION_BUILDER_TABS.CAPS_BUILDER,
              className: SessionStyles.scrollingTab,
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
              className: SessionStyles.scrollingTab,
              disabled: savedSessions.length === 0,
              children: <SavedSessions {...props} />,
            },
            {
              label: t('Attach to Session'),
              key: SESSION_BUILDER_TABS.ATTACH_TO_SESSION,
              className: SessionStyles.scrollingTab,
              children: <AttachToSession {...props} />,
            },
          ]}
        />

        <div className={SessionStyles.sessionFooter}>
          <div className={SessionStyles.desiredCapsLink}>
            <a href="#" onClick={(e) => e.preventDefault() || openLink(LINKS.CAPS_DOCS)}>
              <LinkOutlined />
              &nbsp;
              {t('desiredCapabilitiesDocumentation')}
            </a>
          </div>
          {!isAttaching && capsUUID && (
            <Button
              onClick={() =>
                saveSession(server, serverType, caps, {name: capsName, uuid: capsUUID})
              }
              disabled={!isCapsDirty || isEditingDesiredCaps}
            >
              {t('Save')}
            </Button>
          )}
          {!isAttaching && (
            <Button onClick={requestSaveAsModal} disabled={isEditingDesiredCaps}>
              {t('saveAs')}
            </Button>
          )}
          {!isAttaching && (
            <Button
              type={BUTTON.PRIMARY}
              id="btnStartSession"
              onClick={() => loadNewSession(caps)}
              className={SessionStyles['start-session-button']}
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
