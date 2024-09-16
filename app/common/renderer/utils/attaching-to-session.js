import axios from 'axios';
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
    super('capabilities' in caps ? caps.capabilities : caps);
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

// Make a session-related HTTP GET request to the provided Appium server URL
export async function fetchSessionInformation({url, authToken, ...params}) {
  return await axios({
    url,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(authToken ? {Authorization: `Basic ${authToken}`} : {}),
    },
    ...params,
  });
}

export function formatSeleniumGridSessions(res) {
  // Selenium Grid returns a more complex structure than Appium:
  // it can have multiple nodes, each with multiple slots, which can then have a session.
  // We extract any session details from this structure and package it into
  // the same format returned by Appium
  const formattedGridSessions = [];
  const content = res.data.value ?? {};
  const nodes = content.nodes ?? [];
  for (const node of nodes) {
    const slots = node.slots ?? [];
    for (const slot of slots) {
      const sessionDetails = slot.session;
      if (_.isUndefined(sessionDetails?.capabilities?.['appium:automationName'])) {
        // not a valid Appium 2+ session
        continue;
      }
      formattedGridSessions.push({
        id: sessionDetails.sessionId,
        capabilities: sessionDetails.capabilities.desired,
      });
    }
  }
  return formattedGridSessions;
}
