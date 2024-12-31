import {PlusOutlined, DeleteOutlined} from '@ant-design/icons';
import {Button, Input, Space, Table, Tooltip} from 'antd';
import {useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {setEnvironmentVariables, addEnvironmentVariable, deleteEnvironmentVariable} from '../../actions/Inspector';
import styles from './EnvironmentVariables.module.css';

const EnvironmentVariables = ({t}) => {
  const dispatch = useDispatch();
  const envVars = useSelector(state => state.inspector.environmentVariables || []);
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
        <Tooltip title={t('Delete Variable')}>
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              dispatch(deleteEnvironmentVariable(record.key));
            }}
          />
        </Tooltip>
      ),
    },
  ];

  const handleAddVariable = () => {
    if (!newVar.key || !newVar.value) return;
    
    // Check for duplicate keys
    if (envVars.some((v) => v.key === newVar.key)) {
      return;
    }

    dispatch(addEnvironmentVariable(newVar.key, newVar.value));
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
      <Table
        columns={columns}
        dataSource={envVars}
        pagination={false}
        rowKey="key"
        size="small"
      />
    </div>
  );
};

export default EnvironmentVariables;
