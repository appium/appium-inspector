import React, { Component } from 'react';
import { Table, Button } from 'antd';
import { withTranslation } from '../../util';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

class SavedGestures extends Component {

  render () {

    const {showGestureEditor, savedGestures} = this.props;

    const dataSource = Object.keys(savedGestures).map(
        (key) => ({key, name: key, description: savedGestures[key].description}));

    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        render: (text) => (
          <div>
            <Button
              onClick={showGestureEditor(savedGestures[text])}
              icon={<EditOutlined/>}
              type='text'
            />
            <Button
              icon={<DeleteOutlined/>}
              type='text'
            />
          </div>
        )
      },
    ];

    return <Table
      dataSource={dataSource}
      columns={columns}
      pagination={false}
      footer={() => <Button
        onClick={showGestureEditor}
        icon={<PlusOutlined/>}
      />}
    />;
  }
}

export default withTranslation(SavedGestures);