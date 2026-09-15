import {Space} from 'antd';

import SessionInfoCodeBox from './SessionInfoCodeBox.jsx';
import SessionInfoTabCard from './SessionInfoTabCard.jsx';
import SessionInfoTable from './SessionInfoTable.jsx';

import inspectorStyles from '../SessionInspector.module.css';

/**
 * Contents of the session information tab.
 */
const SessionInfo = (props) => {
  const {clientFramework, setClientFramework, serverDetails, sessionCaps} = props;

  return (
    <SessionInfoTabCard>
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="middle">
        <SessionInfoTable {...props} />
        <SessionInfoCodeBox
          clientFramework={clientFramework}
          setClientFramework={setClientFramework}
          serverDetails={serverDetails}
          sessionCaps={sessionCaps}
        />
      </Space>
    </SessionInfoTabCard>
  );
};

export default SessionInfo;
