import {Refractor} from 'react-refractor';

import {CLIENT_FRAMEWORK_MAP} from '../../../lib/client-frameworks/map.js';
import SessionInfoCodeBoxCard from './SessionInfoCodeBoxCard.jsx';

/**
 * Code box with boilerplate code to start a session matching the current one.
 */
const SessionInfoCodeBox = ({clientFramework, setClientFramework, serverDetails, sessionCaps}) => {
  const {serverUrl, serverUrlParts} = serverDetails;
  const ClientFrameworkClass = CLIENT_FRAMEWORK_MAP[clientFramework];

  const framework = new ClientFrameworkClass(serverUrl, serverUrlParts, sessionCaps);
  const clientCode = framework.getCodeString(true);

  return (
    <SessionInfoCodeBoxCard
      clientCode={clientCode}
      clientFramework={clientFramework}
      setClientFramework={setClientFramework}
    >
      <Refractor language={ClientFrameworkClass.refractorLang} value={clientCode} />
    </SessionInfoCodeBoxCard>
  );
};

export default SessionInfoCodeBox;
