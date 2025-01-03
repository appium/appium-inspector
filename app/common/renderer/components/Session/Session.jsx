import {LinkOutlined, SettingOutlined} from '@ant-design/icons';
import {Badge, Button, Card, Spin, Tabs} from 'antd';
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
import EnvironmentVariables from '../Inspector/EnvironmentVariables.jsx';
import AdvancedServerParams from './AdvancedServerParams.jsx';
import AttachToSession from './AttachToSession.jsx';
import CapabilityEditor from './CapabilityEditor.jsx';
import CloudProviders from './CloudProviders.jsx';
import CloudProviderSelector from './CloudProviderSelector.jsx';
import SavedSessions from './SavedSessions.jsx';
import ServerTabCustom from './ServerTabCustom.jsx';
import SessionStyles from './Session.module.css';

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
    loadEnvironmentVariables,
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
      loadEnvironmentVariables,
    } = props;
    (async () => {
      try {
        bindWindowClose();
        switchTabs(SESSION_BUILDER_TABS.CAPS_BUILDER);
        await getSavedSessions();
        await setVisibleProviders();
        await setSavedServerParams();
        await setLocalServerParams();
        await loadEnvironmentVariables();
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
          <AdvancedServerParams {...props} />
        </div>

        <Tabs
          activeKey={tabKey}
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
            {
              label: t('Environment Variables'),
              key: SESSION_BUILDER_TABS.ENV_VARS,
              children: (
                <Card
                  title={
                    <span>
                      <SettingOutlined /> {t('Environment Variables')}
                    </span>
                  }
                  className={SessionStyles['interaction-tab-card']}
                >
                  <EnvironmentVariables {...props} />
                </Card>
              ),
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
