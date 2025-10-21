import {Tabs} from 'antd';
import _ from 'lodash';

// Dynamic list of driver commands, generated from the driver's method map responses
const MethodMapCommandsList = (props) => {
  const {driverCommands, driverExecuteMethods, t} = props;

  const hasNoCommands = _.isEmpty(driverCommands) || !('rest' in driverCommands);
  const hasNoExecuteMethods = _.isEmpty(driverExecuteMethods);

  return (
    <Tabs
      defaultActiveKey={hasNoCommands ? '2' : '1'}
      size="small"
      centered
      items={[
        {
          label: t('Commands'),
          key: '1',
          disabled: hasNoCommands,
          children: 'Commands',
        },
        {
          label: t('executeMethods'),
          key: '2',
          disabled: hasNoExecuteMethods,
          children: 'Execute Methods',
        },
      ]}
    />
  );
};

export default MethodMapCommandsList;
