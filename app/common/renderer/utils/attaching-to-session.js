import ky from 'ky';
import _ from 'lodash';

import {SERVER_TYPES} from '../constants/session-builder.js';

class DefaultKeySessionCaps {
  constructor(caps) {
    this._caps = caps;
  }

  // sessionName is only populated for cloud providers
  _fetchSessionName() {
    return this._caps.sessionName;
  }

  _fetchDeviceIdentifier() {
    return this._caps.deviceName || this._caps.avd || this._caps.udid;
  }

  _fetchPlatformInfo() {
    if (this._caps.platformName) {
      const platformInfo = this._caps.platformVersion
        ? `${this._caps.platformName} ${this._caps.platformVersion}`
        : this._caps.platformName;
      // Capabilities may not have automationName for e.g. Selenium Grid
      return this._caps.automationName
        ? `${platformInfo} (${this._caps.automationName})`
        : platformInfo;
    }
    return this._caps.automationName;
  }

  _fetchAppIdentifier() {
    return this._caps.app || this._caps.bundleId || this._caps.appPackage;
  }

  assemble() {
    return {
      sessionName: this._fetchSessionName(),
      deviceId: this._fetchDeviceIdentifier(),
      platformInfo: this._fetchPlatformInfo(),
      appId: this._fetchAppIdentifier(),
    };
  }
}

class TestMuAIKeySessionCaps extends DefaultKeySessionCaps {
  constructor(caps) {
    super('capabilities' in caps ? caps.capabilities : caps);
  }

  _fetchDeviceIdentifier() {
    return 'desired' in this._caps ? this._caps.desired.deviceName : this._caps.deviceName;
  }
}

const getKeySessionCaps = (caps, serverType) => {
  switch (serverType) {
    case SERVER_TYPES.TESTMUAI:
      return new TestMuAIKeySessionCaps(caps);
    default:
      return new DefaultKeySessionCaps(caps);
  }
};

export const getSessionInfo = (session, serverType) => {
  let timestamp;
  if ('created' in session && !_.isUndefined(session.created)) {
    // Add the timestamp for Appium 3+ sessions
    timestamp = new Date(session.created).toJSON();
  }

  const keyCaps = getKeySessionCaps(session.capabilities, serverType).assemble();

  return {
    id: session.id,
    timestamp,
    ...keyCaps,
  };
};

// Make a session-related HTTP GET request to the provided Appium server URL
export async function fetchSessionInformation({url, headers, ...params}) {
  return await ky(url, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...headers,
    },
    ...params,
  }).json();
}

export function formatSeleniumGridSessions(res) {
  // Selenium Grid returns a more complex structure than Appium:
  // it can have multiple nodes, each with multiple slots, which can then have a session.
  // We extract any session details from this structure and package it into
  // the same format returned by Appium
  const formattedGridSessions = [];
  const content = res.value ?? {};
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
