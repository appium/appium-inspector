import _ from 'lodash';

import {CAPABILITY_TYPES, SERVER_TYPES} from '../constants/session-builder';

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

export function parseSessionFileContents(sessionFileString) {
  try {
    const sessionJSON = JSON.parse(sessionFileString);
    for (const sessionProp of ['version', 'caps', 'serverType']) {
      if (!(sessionProp in sessionJSON)) {
        return null;
      }
    }
    if (!_.values(SERVER_TYPES).includes(sessionJSON.serverType)) {
      return null;
    } else if (!_.isArray(sessionJSON.caps)) {
      return null;
    } else {
      for (const cap of sessionJSON.caps) {
        for (const capProp of ['type', 'name', 'value']) {
          if (!(capProp in cap)) {
            return null;
          }
        }
        if (!_.values(CAPABILITY_TYPES).includes(cap.type)) {
          return null;
        }
      }
    }
    return sessionJSON;
  } catch {
    return null;
  }
}
