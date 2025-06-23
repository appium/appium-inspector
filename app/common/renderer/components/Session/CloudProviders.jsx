import BitBarLogo from '../../assets/images/bitbar_logo.svg';
import BitBarLogoDark from '../../assets/images/bitbar_logo_dark.svg';
import BrowserStackLogo from '../../assets/images/browserstack_logo.svg';
import BrowserStackLogoDark from '../../assets/images/browserstack_logo_dark.svg';
import ExperitestLogo from '../../assets/images/experitest_logo.svg';
import ExperitestLogoDark from '../../assets/images/experitest_logo_dark.svg';
import HeadSpinLogo from '../../assets/images/headspin_logo.svg';
import KobitonLogo from '../../assets/images/kobiton_logo.svg';
import KobitonLogoDark from '../../assets/images/kobiton_logo_dark.svg';
import LambdaTestLogo from '../../assets/images/lambdatest_logo.svg';
import MobitruLogo from '../../assets/images/mobitru_logo.svg';
import MobitruLogoDark from '../../assets/images/mobitru_logo_dark.svg';
import PcloudyLogo from '../../assets/images/pcloudy_logo.svg';
import PcloudyLogoDark from '../../assets/images/pcloudy_logo_dark.svg';
import PerfectoLogo from '../../assets/images/perfecto_logo.svg';
import PerfectoLogoDark from '../../assets/images/perfecto_logo_dark.svg';
import RemoteTestKitLogo from '../../assets/images/remotetestkit_logo.svg';
import RemoteTestKitLogoDark from '../../assets/images/remotetestkit_logo_dark.svg';
import RobotQALogo from '../../assets/images/robotqa_logo.svg';
import RobotQALogoDark from '../../assets/images/robotqa_logo_dark.svg';
import SauceLogo from '../../assets/images/sauce_logo.svg';
import SauceLogoDark from '../../assets/images/sauce_logo_dark.svg';
import TestcribeLogo from '../../assets/images/testcribe_logo.svg';
import TestcribeLogoDark from '../../assets/images/testcribe_logo_dark.svg';
import TestingBotLogo from '../../assets/images/testingbot_logo.svg';
import TestingBotLogoDark from '../../assets/images/testingbot_logo_dark.svg';
import TVLabsLogo from '../../assets/images/tvlabs_logo.svg';
import TVLabsLogoDark from '../../assets/images/tvlabs_logo_dark.svg';
import {SERVER_TYPES} from '../../constants/session-builder.js';
import {useTheme} from '../../hooks/use-theme';
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
import ServerTabTestcribe from './ServerTabTestcribe.jsx';
import ServerTabTestingbot from './ServerTabTestingbot.jsx';
import ServerTabTVLabs from './ServerTabTVLabs.jsx';
import SessionStyles from './Session.module.css';

const logoMapping = {
  [SERVER_TYPES.SAUCE]: {
    light: SauceLogo,
    dark: SauceLogoDark,
  },
  [SERVER_TYPES.HEADSPIN]: {
    light: HeadSpinLogo,
    dark: null,
  },
  [SERVER_TYPES.BROWSERSTACK]: {
    light: BrowserStackLogo,
    dark: BrowserStackLogoDark,
  },
  [SERVER_TYPES.LAMBDATEST]: {
    light: LambdaTestLogo,
    dark: null,
  },
  [SERVER_TYPES.TESTINGBOT]: {
    light: TestingBotLogo,
    dark: TestingBotLogoDark,
  },
  [SERVER_TYPES.EXPERITEST]: {
    light: ExperitestLogo,
    dark: ExperitestLogoDark,
  },
  [SERVER_TYPES.ROBOTQA]: {
    light: RobotQALogo,
    dark: RobotQALogoDark,
  },
  [SERVER_TYPES.REMOTETESTKIT]: {
    light: RemoteTestKitLogo,
    dark: RemoteTestKitLogoDark,
  },
  [SERVER_TYPES.BITBAR]: {
    light: BitBarLogo,
    dark: BitBarLogoDark,
  },
  [SERVER_TYPES.KOBITON]: {
    light: KobitonLogo,
    dark: KobitonLogoDark,
  },
  [SERVER_TYPES.PERFECTO]: {
    light: PerfectoLogo,
    dark: PerfectoLogoDark,
  },
  [SERVER_TYPES.PCLOUDY]: {
    light: PcloudyLogo,
    dark: PcloudyLogoDark,
  },
  [SERVER_TYPES.MOBITRU]: {
    light: MobitruLogo,
    dark: MobitruLogoDark,
  },
  [SERVER_TYPES.TVLABS]: {
    light: TVLabsLogo,
    dark: TVLabsLogoDark,
  },
  [SERVER_TYPES.TESTCRIBE]: {
    light: TestcribeLogo,
    dark: TestcribeLogoDark,
  },
};

const ProviderLogo = ({serverType}) => {
  const {isDarkTheme} = useTheme();
  const logos = logoMapping[serverType];

  if (!logos) {
    return null;
  }

  const logo = isDarkTheme && logos.dark ? logos.dark : logos.light;

  return <img src={logo} />;
};

const providerTabs = {
  [SERVER_TYPES.SAUCE]: ServerTabSauce,
  [SERVER_TYPES.HEADSPIN]: ServerTabHeadspin,
  [SERVER_TYPES.BROWSERSTACK]: ServerTabBrowserstack,
  [SERVER_TYPES.LAMBDATEST]: ServerTabLambdatest,
  [SERVER_TYPES.TESTINGBOT]: ServerTabTestingbot,
  [SERVER_TYPES.EXPERITEST]: ServerTabExperitest,
  [SERVER_TYPES.ROBOTQA]: ServerTabRobotQA,
  [SERVER_TYPES.REMOTETESTKIT]: ServerTabRemoteTestKit,
  [SERVER_TYPES.BITBAR]: ServerTabBitbar,
  [SERVER_TYPES.KOBITON]: ServerTabKobiton,
  [SERVER_TYPES.PERFECTO]: ServerTabPerfecto,
  [SERVER_TYPES.PCLOUDY]: ServerTabPcloudy,
  [SERVER_TYPES.MOBITRU]: ServerTabMobitru,
  [SERVER_TYPES.TVLABS]: ServerTabTVLabs,
  [SERVER_TYPES.TESTCRIBE]: ServerTabTestcribe,
};

const CloudProviders = Object.entries(providerTabs).reduce((acc, [serverType, ProviderTab]) => {
  const logo = <ProviderLogo serverType={serverType} />;

  acc[serverType] = {
    tabhead: () => <span className={SessionStyles.tabText}>{logo}</span>,
    tab: (props) => <ProviderTab {...props} />,
    logo,
  };

  return acc;
}, {});

export default CloudProviders;
