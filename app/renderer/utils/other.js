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
