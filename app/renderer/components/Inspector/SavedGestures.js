import React, { Component } from 'react';
import { Table, Button } from 'antd';
import { withTranslation } from '../../util';
import moment from 'moment';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

class SavedGestures extends Component {


  loadSavedGesture (gesture) {
    const {setLoadedGesture, showGestureEditor} = this.props;
    setLoadedGesture(gesture);
    showGestureEditor();
  }

  handleDelete (id) {
    return () => {
      if (window.confirm('Are you sure?')) {
        this.props.deleteSavedGesture(id);
      }
    };
  }

  getGestureByID (id) {
    const {savedGestures} = this.props;
    for (let gesture of savedGestures) {
      if (gesture.id === id) {
        return gesture;
      }
    }
    throw new Error(`Couldn't find session with uuid ${id}`);
  }

  render () {

    const {savedGestures, showGestureEditor} = this.props;

    console.log(savedGestures);

    const columns = [{
      title: 'Gestures',
      dataIndex: 'name',
      key: 'name'
    }, {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    }, {
      title: 'Created',
      dataIndex: 'date',
      key: 'date'
    }, {
      title: 'Actions',
      key: 'action',
      render: (_, record) => {
        let gesture = this.getGestureByID(record.key);
        return (
          <div>
            <Button
              icon={<EditOutlined/>}
              onClick={() => this.loadSavedGesture(gesture)}
            />
            <Button
              icon={<DeleteOutlined/>}
              onClick={this.handleDelete(gesture.id)}/>
          </div>
        );
      }
    }];

    let dataSource = [];
    if (savedGestures) {
      dataSource = savedGestures.map((gesture) => ({
        key: gesture.id,
        name: (gesture.name || '(Unnamed)'),
        date: moment(gesture.date).format('YYYY-MM-DD'),
        description: gesture.description || 'No Description',
      }));
    }

    return <Table
      pagination={false}
      dataSource={dataSource}
      columns={columns}
      footer={() => <Button
        onClick={showGestureEditor}
        icon={<PlusOutlined/>}
      />}
    />;
  }
}

export default withTranslation(SavedGestures);