import _ from 'lodash';
import { retryInterval } from 'asyncbox';
import BasePage from '../../../gui-common/base-page-object';

export default class InspectorPage extends BasePage {
  constructor (client) {
    super(client);
    Object.assign(this, InspectorPage.selectors);
  }

  desiredCapabilityNameInput (rowIndex) {
    return `#desiredCapabilityName_${rowIndex}`;
  }

  desiredCapabilityValueInput (rowIndex) {
    return `#desiredCapabilityValue_${rowIndex}`;
  }

  async setCustomServerHost (host) {
    await (await this.client.$(this.customServerHost)).setValue(host);
  }

  async setCustomServerPort (port) {
    await (await this.client.$(this.customServerPort)).setValue(port);
  }

  async setCustomServerPath (path) {
    await (await this.client.$(this.customServerPath)).setValue(path);
  }

  async addDCaps (dcaps) {
    const dcapsPairs = _.toPairs(dcaps);
    for (let i = 0; i < dcapsPairs.length; i++) {
      const [name, value] = dcapsPairs[i];
      await (await this.client.$(this.desiredCapabilityNameInput(i))).setValue(name);
      await (await this.client.$(this.desiredCapabilityValueInput(i))).setValue(value);
      await (await this.client.$(this.addDesiredCapabilityButton)).click();
    }
  }

  async startSession () {
    await (await this.client.$(this.formSubmitButton)).click();
  }

  async closeNotification () {
    try {
      await retryInterval(5, 500, async () => {
        await (await this.client.$('.ant-notification-notice-close')).click();
      });
    } catch (ign) { }
  }

  async startRecording () {
    await (await this.client.$(this.startRecordingButton)).click();
  }

  async pauseRecording () {
    await (await this.client.$(this.pauseRecordingButton)).click();
  }

  async reload () {
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
  reloadButton: '#btnReload',
  screenshotLoadingIndicator: '#screenshotContainer .ant-spin-dot',
};
