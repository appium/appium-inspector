import _ from 'lodash';

import {CAPABILITY_TYPES, SERVER_TYPES} from '../constants/session-builder.js';

export function downloadFile(href, filename) {
  let element = document.createElement('a');
  element.setAttribute('href', href);
  element.setAttribute('download', filename);
  element.style.display = 'none';

  document.body.appendChild(element);
  element.click();

  document.body.removeChild(element);
}

export async function readTextFromUploadedFiles(fileList) {
  const fileReaderPromise = fileList.map((file) => {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (event) =>
        resolve({
          fileName: file.name,
          content: event.target.result,
        });
      reader.onerror = (error) => {
        resolve({
          name: file.name,
          error: error.message,
        });
      };
      reader.readAsText(file);
    });
  });
  return await Promise.all(fileReaderPromise);
}

function parseSessionCaps(sessionCaps) {
  if (!_.isArray(sessionCaps)) {
    return null;
  }
  for (const cap of sessionCaps) {
    for (const capProp of ['type', 'name', 'value']) {
      if (!(capProp in cap)) {
        return null;
      }
    }
    if (!_.values(CAPABILITY_TYPES).includes(cap.type)) {
      return null;
    }
  }
  return sessionCaps;
}

function parseV1SessionFile(sessionJSON) {
  if (!('serverType' in sessionJSON)) {
    return null;
  }
  if (!_.values(SERVER_TYPES).includes(sessionJSON.serverType)) {
    return null;
  }
  return sessionJSON;
}

function parseV2SessionFile(sessionJSON) {
  for (const sessionProp of ['name', 'server']) {
    if (!(sessionProp in sessionJSON)) {
      return null;
    }
  }
  if (!_.values(SERVER_TYPES).includes(_.keys(sessionJSON.server)[0])) {
    return null;
  }
  return sessionJSON;
}

export function parseSessionFileContents(sessionFileString) {
  try {
    const sessionJSON = JSON.parse(sessionFileString);
    for (const sessionProp of ['version', 'caps']) {
      if (!(sessionProp in sessionJSON)) {
        return null;
      }
    }
    if (!parseSessionCaps(sessionJSON.caps)) {
      return null;
    }
    if (sessionJSON.version === '1.0') {
      return parseV1SessionFile(sessionJSON);
    }
    if (sessionJSON.version === '2.0') {
      return parseV2SessionFile(sessionJSON, console);
    }
    return null;
  } catch {
    return null;
  }
}
