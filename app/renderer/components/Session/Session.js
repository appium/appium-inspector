import { shell, ipcRenderer } from '../../polyfills';
import React, { useEffect } from 'react';
import _ from 'lodash';
import CapabilityEditor from './CapabilityEditor';
import SavedSessions from './SavedSessions';
import AttachToSession from './AttachToSession';
import ServerTabCustom from './ServerTabCustom';
import { Tabs, Button, Spin, Badge } from 'antd';
import AdvancedServerParams from './AdvancedServerParams';
import SessionStyles from './Session.css';
import CloudProviders from './CloudProviders';
import CloudProviderSelector from './CloudProviderSelector';
import { LinkOutlined } from '@ant-design/icons';
import { BUTTON } from '../AntdTypes';

const ADD_CLOUD_PROVIDER = 'addCloudProvider';
const CAPS_DOCS_LINK = 'https://appium.io/docs/en/latest/guides/caps/';

const Session = (props) => {
  const { tabKey, switchTabs, serverType, server, visibleProviders = [],
          caps, capsUUID, capsName, isCapsDirty, isEditingDesiredCaps, requestSaveAsModal,
          saveSession, newSession, savedSessions, newSessionLoading, attachSessId, t } = props;

  const isAttaching = tabKey === 'attach';

  const handleSelectServerTab = async (tab) => {
    const { changeServerType, addCloudProvider } = props;
    if (tab === ADD_CLOUD_PROVIDER) {
      addCloudProvider();
      return;
    }
    await changeServerType(tab);
  };

  useEffect(() => {
    const { setLocalServerParams, getSavedSessions, setSavedServerParams, setStateFromAppiumFile,
            setVisibleProviders, getRunningSessions, bindWindowClose, saveFile } = props;
    (async () => {
      try {
        bindWindowClose();
        switchTabs('new');
        await getSavedSessions();
        await setSavedServerParams();
        await setLocalServerParams();
        await setVisibleProviders();
        getRunningSessions();
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
        <div id='serverTypeTabs' className={SessionStyles.serverTab}>
          <Tabs activeKey={serverType} onChange={(tab) => handleSelectServerTab(tab)} className={SessionStyles.serverTabs} items={[
            {label: t('Appium Server'), key: 'remote', children: <ServerTabCustom {...props} />},
            ..._(visibleProviders).map((providerName) => {
              const provider = CloudProviders[providerName];
              if (!provider) {
                return true;
              }
              return {label: <div>{provider.tabhead()}</div>, key: providerName, children: provider.tab(props)};
            }),
            {label: <span className='addCloudProviderTab'>{ t('Select Cloud Providers') }</span>, key: ADD_CLOUD_PROVIDER}
          ]}/>
          <AdvancedServerParams {...props} />
        </div>

        <Tabs activeKey={tabKey} onChange={switchTabs} className={SessionStyles.scrollingTabCont} items={[
          {label: t('Desired Capabilities'),
           key: 'new', className: SessionStyles.scrollingTab, children: <CapabilityEditor {...props} />},
          {label: (<span>{t('Saved Capability Sets')} <Badge count={savedSessions.length} offset={[0, -3]}/></span>),
           key: 'saved', className: SessionStyles.scrollingTab, disabled: savedSessions.length === 0, children: <SavedSessions {...props} />},
          {label: t('Attach to Session'),
           key: 'attach', className: SessionStyles.scrollingTab, children: <AttachToSession {...props} />}
        ]}/>

        <div className={SessionStyles.sessionFooter}>
          <div className={SessionStyles.desiredCapsLink}>
            <a href="#" onClick={(e) => e.preventDefault() || shell.openExternal(CAPS_DOCS_LINK)}>
              <LinkOutlined />&nbsp;
              {t('desiredCapabilitiesDocumentation')}
            </a>
          </div>
          {(!isAttaching && capsUUID) && <Button
            onClick={() => saveSession(server, serverType, caps, {name: capsName, uuid: capsUUID})}
            disabled={!isCapsDirty || isEditingDesiredCaps}>{t('Save')}
          </Button>}
          {!isAttaching && <Button
            onClick={requestSaveAsModal} disabled={isEditingDesiredCaps}>{t('saveAs')}
          </Button>}
          {!isAttaching && <Button type={BUTTON.PRIMARY} id='btnStartSession'
            onClick={() => newSession(caps)} className={SessionStyles['start-session-button']}>{t('startSession')}
          </Button>}
          {isAttaching && <Button type={BUTTON.PRIMARY} disabled={!attachSessId}
            onClick={() => newSession(null, attachSessId)}>{t('attachToSession')}
          </Button>}
        </div>

      </div>
    </Spin>,
    <CloudProviderSelector {...props} key='CloudProviderSelector' />
  ];
};

export default Session;
