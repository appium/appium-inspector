import BitBarLogo from '../../assets/images/bitbar_logo.svg';
import BrowserStackLogo from '../../assets/images/browserstack_logo.svg';
import ExperitestLogo from '../../assets/images/experitest_logo.svg';
import HeadSpinLogo from '../../assets/images/headspin_logo.svg';
import KobitonLogo from '../../assets/images/kobiton_logo.svg';
import LambdaTestLogo from '../../assets/images/lambdatest_logo.svg';
import MobitruLogo from '../../assets/images/mobitru_logo.svg';
import PcloudyLogo from '../../assets/images/pcloudy_logo.svg';
import PerfectoLogo from '../../assets/images/perfecto_logo.svg';
import RemoteTestKitLogo from '../../assets/images/remotetestkit_logo.svg';
import RobotQALogo from '../../assets/images/robotqa_logo.svg';
import SauceLogo from '../../assets/images/sauce_logo.svg';
import TestingBotLogo from '../../assets/images/testingbot_logo.svg';
import {SERVER_TYPES} from '../../constants/session-builder.js';
import ServerTabBitbar from './ServerTabBitbar.jsx';
import ServerTabBrowserstack from './ServerTabBrowserstack.jsx';
import ServerTabExperitest from './ServerTabExperitest.jsx';
import ServerTabHeadspin from './ServerTabHeadspin.jsx';
import ServerTabKobiton from './ServerTabKobiton.jsx';
import ServerTabLambdatest from './ServerTabLambdatest.jsx';
import ServerTabMobitru from './ServerTabMobitru.jsx';
import ServerTabPcloudy from './ServerTabPcloudy.jsx';
import ServerTabPerfecto from './ServerTabPerfecto.jsx';
import ServerTabRemoteTestKit from './ServerTabRemoteTestKit.jsx';
import ServerTabRobotQA from './ServerTabRobotQA.jsx';
import ServerTabSauce from './ServerTabSauce.jsx';
import ServerTabTestingbot from './ServerTabTestingbot.jsx';
import SessionStyles from './Session.module.css';

const providerWrapper = (logo, providerComponent) => ({
  tabhead: () => (
    <span className={SessionStyles.tabText}>
      <img src={logo} />
    </span>
  ),
  tab: providerComponent,
  logo,
});

const CloudProviders = {};

CloudProviders[SERVER_TYPES.SAUCE] = providerWrapper(SauceLogo, (props) => (
  <ServerTabSauce {...props} />
));
CloudProviders[SERVER_TYPES.HEADSPIN] = providerWrapper(HeadSpinLogo, (props) => (
  <ServerTabHeadspin {...props} />
));
CloudProviders[SERVER_TYPES.BROWSERSTACK] = providerWrapper(BrowserStackLogo, (props) => (
  <ServerTabBrowserstack {...props} />
));
CloudProviders[SERVER_TYPES.LAMBDATEST] = providerWrapper(LambdaTestLogo, (props) => (
  <ServerTabLambdatest {...props} />
));
CloudProviders[SERVER_TYPES.TESTINGBOT] = providerWrapper(TestingBotLogo, (props) => (
  <ServerTabTestingbot {...props} />
));
CloudProviders[SERVER_TYPES.EXPERITEST] = providerWrapper(ExperitestLogo, (props) => (
  <ServerTabExperitest {...props} />
));
CloudProviders[SERVER_TYPES.ROBOTQA] = providerWrapper(RobotQALogo, (props) => (
  <ServerTabRobotQA {...props} />
));
CloudProviders[SERVER_TYPES.REMOTETESTKIT] = providerWrapper(RemoteTestKitLogo, (props) => (
  <ServerTabRemoteTestKit {...props} />
));
CloudProviders[SERVER_TYPES.BITBAR] = providerWrapper(BitBarLogo, (props) => (
  <ServerTabBitbar {...props} />
));
CloudProviders[SERVER_TYPES.KOBITON] = providerWrapper(KobitonLogo, (props) => (
  <ServerTabKobiton {...props} />
));
CloudProviders[SERVER_TYPES.PERFECTO] = providerWrapper(PerfectoLogo, (props) => (
  <ServerTabPerfecto {...props} />
));
CloudProviders[SERVER_TYPES.PCLOUDY] = providerWrapper(PcloudyLogo, (props) => (
  <ServerTabPcloudy {...props} />
));
CloudProviders[SERVER_TYPES.MOBITRU] = providerWrapper(MobitruLogo, (props) => (
  <ServerTabMobitru {...props} />
));

export default CloudProviders;
