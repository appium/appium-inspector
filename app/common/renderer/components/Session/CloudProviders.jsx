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

const providers = {
  [SERVER_TYPES.SAUCE]: {
    tab: ServerTabSauce,
    logos: {
      light: SauceLogo,
      dark: SauceLogoDark,
    },
  },
  [SERVER_TYPES.HEADSPIN]: {
    tab: ServerTabHeadspin,
    logos: {
      light: HeadSpinLogo,
      dark: null,
    },
  },
  [SERVER_TYPES.BROWSERSTACK]: {
    tab: ServerTabBrowserstack,
    logos: {
      light: BrowserStackLogo,
      dark: BrowserStackLogoDark,
    },
  },
  [SERVER_TYPES.LAMBDATEST]: {
    tab: ServerTabLambdatest,
    logos: {
      light: LambdaTestLogo,
      dark: null,
    },
  },
  [SERVER_TYPES.TESTINGBOT]: {
    tab: ServerTabTestingbot,
    logos: {
      light: TestingBotLogo,
      dark: TestingBotLogoDark,
    },
  },
  [SERVER_TYPES.EXPERITEST]: {
    tab: ServerTabExperitest,
    logos: {
      light: ExperitestLogo,
      dark: ExperitestLogoDark,
    },
  },
  [SERVER_TYPES.ROBOTQA]: {
    tab: ServerTabRobotQA,
    logos: {
      light: RobotQALogo,
      dark: RobotQALogoDark,
    },
  },
  [SERVER_TYPES.REMOTETESTKIT]: {
    tab: ServerTabRemoteTestKit,
    logos: {
      light: RemoteTestKitLogo,
      dark: RemoteTestKitLogoDark,
    },
  },
  [SERVER_TYPES.BITBAR]: {
    tab: ServerTabBitbar,
    logos: {
      light: BitBarLogo,
      dark: BitBarLogoDark,
    },
  },
  [SERVER_TYPES.KOBITON]: {
    tab: ServerTabKobiton,
    logos: {
      light: KobitonLogo,
      dark: KobitonLogoDark,
    },
  },
  [SERVER_TYPES.PERFECTO]: {
    tab: ServerTabPerfecto,
    logos: {
      light: PerfectoLogo,
      dark: PerfectoLogoDark,
    },
  },
  [SERVER_TYPES.PCLOUDY]: {
    tab: ServerTabPcloudy,
    logos: {
      light: PcloudyLogo,
      dark: PcloudyLogoDark,
    },
  },
  [SERVER_TYPES.MOBITRU]: {
    tab: ServerTabMobitru,
    logos: {
      light: MobitruLogo,
      dark: MobitruLogoDark,
    },
  },
  [SERVER_TYPES.TVLABS]: {
    tab: ServerTabTVLabs,
    logos: {
      light: TVLabsLogo,
      dark: TVLabsLogoDark,
    },
  },
  [SERVER_TYPES.TESTCRIBE]: {
    tab: ServerTabTestcribe,
    logos: {
      light: TestcribeLogo,
      dark: TestcribeLogoDark,
    },
  },
};

const ProviderLogo = ({serverType}) => {
  const {isDarkTheme} = useTheme();
  const {logos} = providers[serverType];

  if (!logos) {
    return null;
  }

  const logo = isDarkTheme && logos.dark ? logos.dark : logos.light;

  return <img src={logo} />;
};

const CloudProviders = Object.entries(providers).reduce((acc, [serverType, provider]) => {
  const logo = <ProviderLogo serverType={serverType} />;

  acc[serverType] = {
    tabhead: () => <span className={SessionStyles.tabText}>{logo}</span>,
    tab: (props) => <provider.tab {...props} />,
    logo,
  };

  return acc;
}, {});

export default CloudProviders;
