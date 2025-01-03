import {DeleteOutlined, PlusOutlined} from '@ant-design/icons';
import {Button, Input, Popconfirm, Space, Table, Tooltip} from 'antd';
import {useState} from 'react';
import {connect} from 'react-redux';

import {
  addEnvironmentVariable,
  deleteEnvironmentVariable,
  setEnvironmentVariables,
} from '../../actions/Inspector';
import styles from './Inspector.module.css';

const EnvironmentVariables = ({t, envVars, addVariable, deleteVariable}) => {
  const [newVar, setNewVar] = useState({key: '', value: ''});

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
        <Tooltip zIndex={3} title={t('Delete Variable')}>
          <Popconfirm
            zIndex={4}
            title={t('Are you sure you want to delete this variable?')}
            placement="topRight"
            okText={t('OK')}
            cancelText={t('Cancel')}
            onConfirm={() => deleteVariable(record.key)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  const handleAddVariable = () => {
    if (!newVar.key || !newVar.value) {
      return;
    }

    // Check for duplicate keys
    if (envVars.some((v) => v.key === newVar.key)) {
      return;
    }

    addVariable(newVar.key, newVar.value);
    setNewVar({key: '', value: ''});
  };

  return (
    <div className={styles.container}>
      <div className={styles.addForm}>
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
      <Table columns={columns} dataSource={envVars} pagination={false} rowKey="key" size="small" />
    </div>
  );
};

const mapStateToProps = (state) => ({
  envVars: state.inspector.environmentVariables || [],
});

const mapDispatchToProps = (dispatch) => ({
  addVariable: (key, value) => dispatch(addEnvironmentVariable(key, value)),
  deleteVariable: (key) => dispatch(deleteEnvironmentVariable(key)),
});

export default connect(mapStateToProps, mapDispatchToProps)(EnvironmentVariables);
