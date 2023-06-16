import { shell, ipcRenderer } from '../../polyfills';
import React, { Component } from 'react';
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

export default class Session extends Component {

  componentDidMount () {
    const {setLocalServerParams, getSavedSessions, setSavedServerParams, setStateFromAppiumFile,
           setVisibleProviders, getRunningSessions, bindWindowClose, initFromQueryString, saveFile, switchTabs} = this.props;
    (async () => {
      try {
        bindWindowClose();
        switchTabs('new');
        await getSavedSessions();
        await setSavedServerParams();
        await setLocalServerParams();
        await setVisibleProviders();
        getRunningSessions();
        await initFromQueryString();
        await setStateFromAppiumFile();
        ipcRenderer.on('open-file', (evt, filePath) => {
          setStateFromAppiumFile(filePath);
        });
        ipcRenderer.on('save-file', (evt, filePath) => {
          saveFile(filePath);
        });
      } catch (e) {
        console.error(e); // eslint-disable-line no-console
      }
    })();
  }

  async handleSelectServerTab (tab) {
    const {changeServerType, addCloudProvider} = this.props;
    if (tab === ADD_CLOUD_PROVIDER) {
      addCloudProvider();
      return;
    }
    await changeServerType(tab);
  }

  render () {
    const {savedSessions, tabKey, switchTabs,
           serverType, server,
           requestSaveAsModal, newSession, caps, capsUUID, capsName, saveSession,
           visibleProviders = [],
           isCapsDirty, isEditingDesiredCaps, newSessionLoading, attachSessId, t} = this.props;

    const isAttaching = tabKey === 'attach';

    return [
      <Spin spinning={!!newSessionLoading} key="main">
        <div className={SessionStyles.sessionContainer}>
          <div id='serverTypeTabs' className={SessionStyles.serverTab}>
            <Tabs activeKey={serverType} onChange={(tab) => this.handleSelectServerTab(tab)} className={SessionStyles.serverTabs} items={[{
              label: t('Appium Server'), key: 'remote', children:
                <ServerTabCustom {...this.props} />
            },
            ..._(visibleProviders).map((providerName) => {
              const provider = CloudProviders[providerName];
              if (!provider) {
                return true;
              }

              return {label: <div>{provider.tabhead()}</div>, key: providerName, children: provider.tab(this.props)};
            }),
            {label: <span className='addCloudProviderTab'>{ t('Select Cloud Providers') }</span>, key: ADD_CLOUD_PROVIDER}
            ]}/>
            <AdvancedServerParams {...this.props} />
          </div>

          <Tabs activeKey={tabKey} onChange={switchTabs} className={SessionStyles.scrollingTabCont} items={[{
            label: t('Desired Capabilities'), key: 'new', className: SessionStyles.scrollingTab, children:
              <CapabilityEditor {...this.props} />
          }, {
            label: (<span>{t('Saved Capability Sets')} <Badge count={savedSessions.length} offset={[0, -3]}/></span>),
            key: 'saved', className: SessionStyles.scrollingTab, disabled: savedSessions.length === 0, children:
              <SavedSessions {...this.props} />
          }, {
            label: t('Attach to Session'), key: 'attach', className: SessionStyles.scrollingTab, children:
              <AttachToSession {...this.props} />
          }]}/>

          <div className={SessionStyles.sessionFooter}>
            <div className={SessionStyles.desiredCapsLink}>
              <a href="#" onClick={(e) => e.preventDefault() || shell.openExternal('https://appium.io/docs/en/latest/guides/caps/')}>
                <LinkOutlined />&nbsp;
                {t('desiredCapabilitiesDocumentation')}
              </a>
            </div>
            { (!isAttaching && capsUUID) && <Button
              onClick={() => saveSession(server, serverType, caps, {name: capsName, uuid: capsUUID})}
              disabled={!isCapsDirty || isEditingDesiredCaps}>{t('Save')}</Button> }
            {!isAttaching && <Button
              onClick={requestSaveAsModal} disabled={isEditingDesiredCaps}>{t('saveAs')}</Button>}
            {!isAttaching && <Button type={BUTTON.PRIMARY} id='btnStartSession'
              onClick={() => newSession(caps)} className={SessionStyles['start-session-button']}>{t('startSession')}</Button>
            }
            {isAttaching &&
              <Button type={BUTTON.PRIMARY} disabled={!attachSessId} onClick={() => newSession(null, attachSessId)}>
                {t('attachToSession')}
              </Button>
            }
          </div>

        </div>
      </Spin>,
      <CloudProviderSelector {...this.props} key='CloudProviderSelector' />
    ];
  }
}
