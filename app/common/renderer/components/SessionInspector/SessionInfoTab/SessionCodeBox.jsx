import {Refractor} from 'react-refractor';

import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import SessionCodeBoxCard from './SessionCodeBoxCard.jsx';

/**
 * Code box with boilerplate code to start a session matching the current one.
 */
const SessionCodeBox = ({clientFramework, setClientFramework, serverDetails, sessionCaps}) => {
  const {serverUrl, serverUrlParts} = serverDetails;
  const ClientFrameworkClass = CLIENT_FRAMEWORK_MAP[clientFramework];

  const framework = new ClientFrameworkClass(serverUrl, serverUrlParts, sessionCaps);
  const clientCode = framework.getCodeString(true);

  return (
    <SessionCodeBoxCard
      clientCode={clientCode}
      clientFramework={clientFramework}
      setClientFramework={setClientFramework}
    >
      <Refractor language={ClientFrameworkClass.refractorLang} value={clientCode} />
    </SessionCodeBoxCard>
  );
};

export default SessionCodeBox;
