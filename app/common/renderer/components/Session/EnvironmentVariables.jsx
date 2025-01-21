import {DeleteOutlined, PlusOutlined, SettingOutlined} from '@ant-design/icons';
import {Button, Card, Input, Popconfirm, Space, Table, Tooltip} from 'antd';
import {useState} from 'react';

import SessionStyles from './Session.module.css';

const EnvironmentVariables = ({t, envVars, addVariable, deleteVariable}) => {
  const [newVar, setNewVar] = useState({key: '', value: ''});

  const tableData = Array.from(envVars, ([key, value]) => ({key, value}));

  const columns = [
    {
      title: t('Variable Name'),
      dataIndex: 'key',
      key: 'key',
      width: '40%',
    },
    {
      title: t('Value'),
      dataIndex: 'value',
      key: 'value',
      width: '40%',
      render: (text) => <Input.Password value={text} readOnly />,
    },
    {
      title: t('Actions'),
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Tooltip zIndex={3} title={t('Delete')}>
          <Popconfirm
            zIndex={4}
            title={t('confirmDeletion')}
            placement="topRight"
            okText={t('OK')}
            cancelText={t('Cancel')}
            onConfirm={() => deleteVariable(record.key)}
          >
            <Button icon={<DeleteOutlined />} />
          </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  const handleAddVariable = () => {
    if (!newVar.key || !newVar.value) {
      return;
    }

    // Check for duplicate keys is no longer needed since Map handles this automatically
    addVariable(newVar.key, newVar.value);
    setNewVar({key: '', value: ''});
  };

  return (
    <Card
      title={
        <span>
          <SettingOutlined /> {t('Environment Variables')}
        </span>
      }
      className={SessionStyles['interaction-tab-card']}
    >
      <div className={SessionStyles.container}>
        <div className={SessionStyles.addForm}>
          <Space.Compact style={{width: '100%'}}>
            <Input
              placeholder={t('Variable Name')}
              value={newVar.key}
              onChange={(e) => setNewVar({...newVar, key: e.target.value})}
            />
            <Input.Password
              placeholder={t('Value')}
              value={newVar.value}
              onChange={(e) => setNewVar({...newVar, value: e.target.value})}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddVariable}
              disabled={!newVar.key || !newVar.value}
            >
              {t('Add')}
            </Button>
          </Space.Compact>
        </div>
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={false}
          rowKey="key"
          size="small"
        />
      </div>
    </Card>
  );
};

export default EnvironmentVariables;
