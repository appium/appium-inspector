import _ from 'lodash';

import {SERVER_TYPES} from '../constants/session-builder';

class DefaultSessionDescription {
  constructor(caps) {
    this._caps = caps;
  }

  // sessionName is only populated for cloud providers
  _fetchSessionName() {
    return this._caps.sessionName;
  }

  _fetchDeviceInfo() {
    return this._caps.deviceName || this._caps.avd || this._caps.udid;
  }

  _fetchPlatformInfo() {
    if (this._caps.platformName) {
      const platformInfo = this._caps.platformVersion
        ? `${this._caps.platformName} ${this._caps.platformVersion}`
        : this._caps.platformName;
      return platformInfo;
    }
  }

  _fetchAutomationName() {
    return this._caps.automationName;
  }

  _fetchAppInfo() {
    return this._caps.app || this._caps.bundleId || this._caps.appPackage;
  }

  assemble() {
    const suffixItems = [
      this._fetchSessionName(),
      this._fetchDeviceInfo(),
      this._fetchPlatformInfo(),
      this._fetchAutomationName(),
      this._fetchAppInfo(),
    ];
    return _.compact(suffixItems).join(' / ');
  }
}

class LambdaTestSessionDescription extends DefaultSessionDescription {
  constructor(caps) {
    super();
    if ('capabilities' in caps) {
      this._caps = caps.capabilities;
    }
  }

  _fetchDeviceInfo() {
    return 'desired' in this._caps ? this._caps.desired.deviceName : this._caps.deviceName;
  }
}

const getSessionDescription = (caps, serverType) => {
  switch (serverType) {
    case SERVER_TYPES.LAMBDATEST:
      return new LambdaTestSessionDescription(caps);
    default:
      return new DefaultSessionDescription(caps);
  }
};

export const getSessionInfo = (session, serverType) =>
  `${session.id} — ${getSessionDescription(session.capabilities, serverType).assemble()}`;
