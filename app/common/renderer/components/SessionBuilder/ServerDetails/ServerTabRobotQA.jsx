import {Input, Space} from 'antd';
import {useTranslation} from 'react-i18next';

const robotQATokenPlaceholder = (t) => {
  if (process.env.ROBOTQA_TOKEN) {
    return t('usingDataFoundIn', {environmentVariable: 'ROBOTQA_TOKEN'});
  }
  return t('Add your token');
};

const ServerTabRobotQA = ({server, setServerParam}) => {
  const {t} = useTranslation();
  return (
    <Space.Compact block>
      <Space.Addon>{t('RobotQA Token')}</Space.Addon>
      <Input
        id="robotQAToken"
        placeholder={robotQATokenPlaceholder(t)}
        value={server.roboticmobi.token}
        onChange={(e) => setServerParam('token', e.target.value)}
      />
    </Space.Compact>
  );
};

export default ServerTabRobotQA;
