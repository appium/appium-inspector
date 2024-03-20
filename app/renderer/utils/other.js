import _ from 'lodash';
import {withTranslation as wt} from 'react-i18next';

import config from '../../configs/app.config';

const VALID_W3C_CAPS = [
  'platformName',
  'browserName',
  'browserVersion',
  'acceptInsecureCerts',
  'pageLoadStrategy',
  'proxy',
  'setWindowRect',
  'timeouts',
  'unhandledPromptBehavior',
];

export function withTranslation(componentCls, ...hocs) {
  return _.flow(...hocs, wt(config.namespace))(componentCls);
}

export function addVendorPrefixes(caps) {
  return caps.map((cap) => {
    // if we don't have a valid unprefixed cap or a cap with an existing prefix, update it
    if (!VALID_W3C_CAPS.includes(cap.name) && !_.includes(cap.name, ':')) {
      cap.name = `appium:${cap.name}`;
    }
    return cap;
  });
}

export function pixelsToPercentage(px, maxPixels) {
  if (!isNaN(px)) {
    return parseFloat(((px / maxPixels) * 100).toFixed(1), 10);
  }
}

export function percentageToPixels(pct, maxPixels) {
  if (!isNaN(pct)) {
    return Math.round(maxPixels * (pct / 100));
  }
}

export function parseCoordinates(element) {
  let {bounds, x, y, width, height} = element.attributes || {};

  if (bounds) {
    let boundsArray = bounds.split(/\[|\]|,/).filter((str) => str !== '');
    const x1 = parseInt(boundsArray[0], 10);
    const x2 = parseInt(boundsArray[2], 10);
    const y1 = parseInt(boundsArray[1], 10);
    const y2 = parseInt(boundsArray[3], 10);
    return {x1, y1, x2, y2};
  } else if (x) {
    x = parseInt(x, 10);
    y = parseInt(y, 10);
    width = parseInt(width, 10);
    height = parseInt(height, 10);
    return {x1: x, y1: y, x2: x + width, y2: y + height};
  } else {
    return {};
  }
}
