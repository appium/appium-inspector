import {Space} from 'antd';

import SessionInfoCard from './SessionInfoCard.jsx';
import SessionInfoCodeBox from './SessionInfoCodeBox.jsx';
import SessionInfoTable from './SessionInfoTable.jsx';

const SessionInfo = (props) => {
  const {clientFramework, setClientFramework, serverDetails, sessionCaps} = props;

  return (
    <SessionInfoCard>
      <Space orientation="vertical" size="middle">
        <SessionInfoTable {...props} />
        <SessionInfoCodeBox
          clientFramework={clientFramework}
          setClientFramework={setClientFramework}
          serverDetails={serverDetails}
          sessionCaps={sessionCaps}
        />
      </Space>
    </SessionInfoCard>
  );
};

export default SessionInfo;
