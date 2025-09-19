import {SERVER_TYPES} from '../../constants/session-builder';
import {BitbarVendor} from './bitbar.js';
import {BrowserstackVendor} from './browserstack.js';
import {ExperitestVendor} from './experitest.js';
import {HeadspinVendor} from './headspin.js';
import {KobitonVendor} from './kobiton.js';
import {LambdatestVendor} from './lambdatest.js';
import {LocalVendor} from './local.js';
import {MobitruVendor} from './mobitru.js';
import {PcloudyVendor} from './pcloudy.js';
import {PerfectoVendor} from './perfecto.js';
import {RemoteVendor} from './remote.js';
import {RemotetestkitVendor} from './remotetestkit.js';
import {RobotqaVendor} from './robotqa.js';
import {SaucelabsVendor} from './saucelabs.js';
import {TestcribeVendor} from './testcribe.js';
import {TestingbotVendor} from './testingbot.js';
import {TvlabsVendor} from './tvlabs.js';
import {WebmateVendor} from './webmate.js';
import {DeviceFarmVendor} from './devicefarm.js';

export const VENDOR_MAP = {
  [SERVER_TYPES.LOCAL]: LocalVendor,
  [SERVER_TYPES.REMOTE]: RemoteVendor,
  [SERVER_TYPES.SAUCE]: SaucelabsVendor,
  [SERVER_TYPES.HEADSPIN]: HeadspinVendor,
  [SERVER_TYPES.PERFECTO]: PerfectoVendor,
  [SERVER_TYPES.BROWSERSTACK]: BrowserstackVendor,
  [SERVER_TYPES.LAMBDATEST]: LambdatestVendor,
  [SERVER_TYPES.BITBAR]: BitbarVendor,
  [SERVER_TYPES.KOBITON]: KobitonVendor,
  [SERVER_TYPES.PCLOUDY]: PcloudyVendor,
  [SERVER_TYPES.TESTINGBOT]: TestingbotVendor,
  [SERVER_TYPES.EXPERITEST]: ExperitestVendor,
  [SERVER_TYPES.ROBOTQA]: RobotqaVendor,
  [SERVER_TYPES.REMOTETESTKIT]: RemotetestkitVendor,
  [SERVER_TYPES.MOBITRU]: MobitruVendor,
  [SERVER_TYPES.TVLABS]: TvlabsVendor,
  [SERVER_TYPES.TESTCRIBE]: TestcribeVendor,
  [SERVER_TYPES.WEBMATE]: WebmateVendor,
  [SERVER_TYPES.DEVICEFARM]: DeviceFarmVendor,
};
