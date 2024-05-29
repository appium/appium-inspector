import _ from 'lodash';
import {withTranslation as wt} from 'react-i18next';

import config from '../../../configs/app.config';

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
    if (
      !_.isUndefined(cap.name) &&
      !VALID_W3C_CAPS.includes(cap.name) &&
      !_.includes(cap.name, ':')
    ) {
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

// Extracts element coordinates from its properties.
// Depending on the platform, this is contained either in the 'bounds' property,
// or the 'x'/'y'/'width'/'height' properties
export function parseCoordinates(element) {
  const {bounds, x, y, width, height} = element.attributes || {};

  if (bounds) {
    const boundsArray = bounds.split(/\[|\]|,/).filter((str) => str !== '');
    const [x1, y1, x2, y2] = boundsArray.map((val) => parseInt(val, 10));
    return {x1, y1, x2, y2};
  } else if (x) {
    const originsArray = [x, y, width, height];
    const [xInt, yInt, widthInt, heightInt] = originsArray.map((val) => parseInt(val, 10));
    return {x1: xInt, y1: yInt, x2: xInt + widthInt, y2: yInt + heightInt};
  } else {
    return {};
  }
}
