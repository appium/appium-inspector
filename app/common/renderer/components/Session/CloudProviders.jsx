import React from 'react';

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

// ParcelJS handles image loading by exporting a path to the image
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

const CloudProviders = {
  sauce: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={SauceLogo} />
      </span>
    ),
    tab: (props) => <ServerTabSauce {...props} />,
    logo: SauceLogo,
  },
  headspin: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={HeadSpinLogo} />
      </span>
    ),
    tab: (props) => <ServerTabHeadspin {...props} />,
    logo: HeadSpinLogo,
  },
  browserstack: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={BrowserStackLogo} />
      </span>
    ),
    tab: (props) => <ServerTabBrowserstack {...props} />,
    logo: BrowserStackLogo,
  },
  lambdatest: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={LambdaTestLogo} />
      </span>
    ),
    tab: (props) => <ServerTabLambdatest {...props} />,
    logo: LambdaTestLogo,
  },
  bitbar: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={BitBarLogo} />
      </span>
    ),
    tab: (props) => <ServerTabBitbar {...props} />,
    logo: BitBarLogo,
  },
  kobiton: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={KobitonLogo} />
      </span>
    ),
    tab: (props) => <ServerTabKobiton {...props} />,
    logo: KobitonLogo,
  },
  perfecto: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={PerfectoLogo} />
      </span>
    ),
    tab: (props) => <ServerTabPerfecto {...props} />,
    logo: PerfectoLogo,
  },
  pcloudy: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={PcloudyLogo} />
      </span>
    ),
    tab: (props) => <ServerTabPcloudy {...props} />,
    logo: PcloudyLogo,
  },
  testingbot: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={TestingBotLogo} />
      </span>
    ),
    tab: (props) => <ServerTabTestingbot {...props} />,
    logo: TestingBotLogo,
  },
  experitest: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={ExperitestLogo} />
      </span>
    ),
    tab: (props) => <ServerTabExperitest {...props} />,
    logo: ExperitestLogo,
  },
  roboticmobi: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={RobotQALogo} />
      </span>
    ),
    tab: (props) => <ServerTabRobotQA {...props} />,
    logo: RobotQALogo,
  },
  remotetestkit: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={RemoteTestKitLogo} />
      </span>
    ),
    tab: (props) => <ServerTabRemoteTestKit {...props} />,
    logo: RemoteTestKitLogo,
  },
  mobitru: {
    tabhead: () => (
      <span className={SessionStyles.tabText}>
        <img src={MobitruLogo} />
      </span>
    ),
    tab: (props) => <ServerTabMobitru {...props} />,
    logo: MobitruLogo,
  },
};

export default CloudProviders;
