import React from 'react';
import ServerTabHeadspin from './ServerTabHeadspin';
import ServerTabBrowserstack from './ServerTabBrowserstack';
import ServerTabLambdatest from './ServerTabLambdatest';
import ServerTabBitbar from './ServerTabBitbar';
import ServerTabKobiton from './ServerTabKobiton';
import ServerTabPerfecto from './ServerTabPerfecto';
import ServerTabPcloudy from './ServerTabPcloudy';
import ServerTabSauce from './ServerTabSauce';
import ServerTabTestingbot from './ServerTabTestingbot';
import ServerTabExperitest from './ServerTabExperitest';
import ServerTabRoboticMobi from './ServerTabRoboticMobi';
import ServerTabRemoteTestKit from './ServerTabRemoteTestKit';

import SessionStyles from './Session.css';

// ParcelJS handles image loading by exporting a path to the image
import SauceLogo from '../../images/sauce_logo.svg';
import HeadSpinLogo from '../../images/headspin_logo.svg';
import BrowserStackLogo from '../../images/browserstack_logo.svg';
import LambdaTestLogo from '../../images/lambdatest_logo.svg';
import BitBarLogo from '../../images/bitbar_logo.svg';
import KobitonLogo from '../../images/kobiton_logo.svg';
import PerfectoLogo from '../../images/perfecto_logo.png';
import PcloudyLogo from '../../images/pcloudy_logo.svg';
import TestingBotLogo from '../../images/testingbot_logo.svg';
import ExperitestLogo from '../../images/experitest_logo.svg';
import RoboticMobiLogo from '../../images/roboticmobi_logo.svg';
import RemoteTestKitLogo from '../../images/remotetestkit_logo.svg';

const CloudProviders = {
  sauce: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={SauceLogo} /></span>,
    tab: (props) => <ServerTabSauce {...props} />,
    logo: SauceLogo,
  },
  headspin: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={HeadSpinLogo} /></span>,
    tab: (props) => <ServerTabHeadspin {...props} />,
    logo: HeadSpinLogo,
  },
  browserstack: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={BrowserStackLogo} /></span>,
    tab: (props) => <ServerTabBrowserstack {...props} />,
    logo: BrowserStackLogo,
  },
  lambdatest: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={LambdaTestLogo} /></span>,
    tab: (props) => <ServerTabLambdatest {...props} />,
    logo: LambdaTestLogo,
  },
  bitbar: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={BitBarLogo} /></span>,
    tab: (props) => <ServerTabBitbar {...props} />,
    logo: BitBarLogo,
  },
  kobiton: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={KobitonLogo} /></span>,
    tab: (props) => <ServerTabKobiton {...props} />,
    logo: KobitonLogo,
  },
  perfecto: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={PerfectoLogo} /></span>,
    tab: (props) => <ServerTabPerfecto {...props} />,
    logo: PerfectoLogo,
  },
  pcloudy: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={PcloudyLogo} /></span>,
    tab: (props) => <ServerTabPcloudy {...props} />,
    logo: PcloudyLogo,
  },
  testingbot: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={TestingBotLogo} /></span>,
    tab: (props) => <ServerTabTestingbot {...props} />,
    logo: TestingBotLogo,
  },
  experitest: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={ExperitestLogo} /></span>,
    tab: (props) => <ServerTabExperitest {...props} />,
    logo: ExperitestLogo,
  },
  roboticmobi: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={RoboticMobiLogo} /></span>,
    tab: (props) => <ServerTabRoboticMobi {...props} />,
    logo: RoboticMobiLogo,
  },
  remotetestkit: {
    tabhead: () => <span className={SessionStyles.tabText}><img src={RemoteTestKitLogo} /></span>,
    tab: (props) => <ServerTabRemoteTestKit {...props} />,
    logo: RemoteTestKitLogo,
  }
};

export default CloudProviders;