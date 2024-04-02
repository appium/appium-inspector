import {LinkOutlined} from '@ant-design/icons';
import {Badge, Button, Spin, Tabs} from 'antd';
import _ from 'lodash';
import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';

import {BUTTON} from '../../constants/antd-types';
import {LINKS} from '../../constants/common';
import {ADD_CLOUD_PROVIDER_TAB_KEY} from '../../constants/session-builder';
import {ipcRenderer, shell} from '../../polyfills';
import AdvancedServerParams from './AdvancedServerParams';
import AttachToSession from './AttachToSession';
import CapabilityEditor from './CapabilityEditor';
import CloudProviderSelector from './CloudProviderSelector';
import CloudProviders from './CloudProviders';
import SavedSessions from './SavedSessions';
import ServerTabCustom from './ServerTabCustom';
import SessionStyles from './Session.css';

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
      setStateFromAppiumFile,
      setVisibleProviders,
      getRunningSessions,
      bindWindowClose,
      initFromQueryString,
      saveFile,
    } = props;
    (async () => {
      try {
        bindWindowClose();
        switchTabs('new');
        await getSavedSessions();
        await setSavedServerParams();
        await setLocalServerParams();
        await setVisibleProviders();
        getRunningSessions();
        initFromQueryString(loadNewSession);
        await setStateFromAppiumFile();
        ipcRenderer.on('open-file', (_, filePath) => setStateFromAppiumFile(filePath));
        ipcRenderer.on('save-file', (_, filePath) => saveFile(filePath));
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
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
              {label: t('Appium Server'), key: 'remote', children: <ServerTabCustom {...props} />},
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
              key: 'new',
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
              key: 'saved',
              className: SessionStyles.scrollingTab,
              disabled: savedSessions.length === 0,
              children: <SavedSessions {...props} />,
            },
            {
              label: t('Attach to Session'),
              key: 'attach',
              className: SessionStyles.scrollingTab,
              children: <AttachToSession {...props} />,
            },
          ]}
        />

        <div className={SessionStyles.sessionFooter}>
          <div className={SessionStyles.desiredCapsLink}>
            <a href="#" onClick={(e) => e.preventDefault() || shell.openExternal(LINKS.CAPS_DOCS)}>
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
