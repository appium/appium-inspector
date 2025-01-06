import {retryInterval} from 'asyncbox';
import _ from 'lodash';

import BasePage from './base-page-object';
import {setValueReact} from './utils';

export default class InspectorPage extends BasePage {
  constructor(client) {
    super(client);
    Object.assign(this, InspectorPage.selectors);
  }

  desiredCapabilityNameInput(rowIndex) {
    return `#desiredCapabilityName_${rowIndex}`;
  }

  desiredCapabilityValueInput(rowIndex) {
    return `#desiredCapabilityValue_${rowIndex}`;
  }

  async setCustomServerHost(host) {
    await this.setValueWithPlaceholder(this.customServerHost, host);
  }

  async setCustomServerPort(port) {
    await this.setValueWithPlaceholder(this.customServerPort, port);
  }

  async setCustomServerPath(path) {
    await this.setValueWithPlaceholder(this.customServerPath, path);
  }

  async setValueWithPlaceholder(locator, value) {
    // for some reason, antd's placeholder based input fields screw with the way wdio or
    // chromedriver fills out the fields. so we need to set the value using some complicated
    // javascript. moreover this on its own isn't sufficient because it doesn't seem to trigger the
    // inspector's internal state updates, so we also click the field a few times which seems to do
    // the trick. ugh.
    await (await this.client.$(locator)).click();
    await this.client.execute(setValueReact(locator, value));
    await (await this.client.$(locator)).click();
  }

  async addDCaps(dcaps) {
    const dcapsPairs = _.toPairs(dcaps);
    for (let i = 0; i < dcapsPairs.length; i++) {
      const [name, value] = dcapsPairs[i];
      await (await this.client.$(this.desiredCapabilityNameInput(i))).setValue(name);
      await (await this.client.$(this.desiredCapabilityValueInput(i))).setValue(value);
      await (await this.client.$(this.addDesiredCapabilityButton)).click();
    }
  }

  async startSession() {
    await (await this.client.$(this.formSubmitButton)).click();
  }

  async closeNotification() {
    try {
      await retryInterval(5, 500, async () => {
        await (await this.client.$('.ant-notification-notice-close')).click();
      });
    } catch {}
  }

  async startRecording() {
    await (await this.client.$(this.startRecordingButton)).click();
  }

  async pauseRecording() {
    await (await this.client.$(this.pauseRecordingButton)).click();
  }

  async reload() {
    await (await this.client.$(this.reloadButton)).click();
  }
}

InspectorPage.selectors = {
  customServerHost: '#customServerHost',
  customServerPort: '#customServerPort',
  customServerPath: '#customServerPath',
  addDesiredCapabilityButton: '#btnAddDesiredCapability',
  formSubmitButton: '#btnStartSession',
  inspectorToolbar: 'div[class*=_inspector-toolbar]',
  selectedElementBody: '#selectedElementContainer .ant-card-body',
  tapSelectedElementButton: '#selectedElementContainer #btnTapElement',
  sourceTreeNode: '#sourceContainer .ant-tree-node-content-wrapper',
  recordedActionsPane: 'div[class*=_recorded-actions]',
  startRecordingButton: '#btnStartRecording',
  pauseRecordingButton: '#btnPause',
  startRefreshingButton: '#btnStartRefreshing',
  pauseRefreshingButton: '#btnPauseRefreshing',
  pressHomeButton: '#btnPressHomeButton',
  reloadButton: '#btnReload',
  screenshotLoadingIndicator: '#screenshotContainer .ant-spin-dot',
};
