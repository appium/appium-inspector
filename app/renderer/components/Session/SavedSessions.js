import React, { Component } from 'react';
import moment from 'moment';
import { Button, Row, Col, Table } from 'antd';
import FormattedCaps from './FormattedCaps';
import SessionStyles from './Session.css';
import {
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

export default class SavedSessions extends Component {

  constructor (props) {
    super(props);
    this.onRow = this.onRow.bind(this);
    this.getRowClassName = this.getRowClassName.bind(this);
  }

  onRow (record) {
    return {
      onClick: () => {
        let session = this.sessionFromUUID(record.key);
        this.handleCapsAndServer(session);
      }
    };
  }

  getRowClassName (record) {
    const {capsUUID} = this.props;
    return capsUUID === record.key ? SessionStyles.selected : '';
  }

  handleCapsAndServer (session) {
    const {setCapsAndServer, server, serverType } = this.props;

    // Incase user has CAPS saved from older version of Inspector which
    // doesn't contain server and serverType within the session object
    setCapsAndServer(session.server || server, session.serverType || serverType, session.caps, session.uuid);
  }

  handleDelete (uuid) {
    return () => {
      if (window.confirm('Are you sure?')) {
        this.props.deleteSavedSession(uuid);
      }
    };
  }

  sessionFromUUID (uuid) {
    const {savedSessions} = this.props;
    for (let session of savedSessions) {
      if (session.uuid === uuid) {
        return session;
      }
    }
    throw new Error(`Couldn't find session with uuid ${uuid}`);
  }

  render () {
    const {savedSessions, capsUUID, switchTabs} = this.props;

    const columns = [{
      title: 'Capability Set',
      dataIndex: 'name',
      key: 'name'
    }, {
      title: 'Created',
      dataIndex: 'date',
      key: 'date'
    }, {
      title: 'Actions',
      key: 'action',
      render: (text, record) => {
        let session = this.sessionFromUUID(record.key);
        return (
          <div>
            <Button
              icon={<EditOutlined/>}
              onClick={() => {this.handleCapsAndServer(session); switchTabs('new');}}
              className={SessionStyles.editSession}
            />
            <Button
              icon={<DeleteOutlined/>}
              onClick={this.handleDelete(session.uuid)}/>
          </div>
        );
      }
    }];

    let dataSource = [];
    if (savedSessions) {
      dataSource = savedSessions.map((session) => ({
        key: session.uuid,
        name: (session.name || '(Unnamed)'),
        date: moment(session.date).format('YYYY-MM-DD')
      }));
    }

    return (<Row className={SessionStyles.savedSessions}>
      <Col span={12}>
        <Table
          pagination={false}
          dataSource={dataSource}
          columns={columns}
          onRow={this.onRow}
          rowClassName={this.getRowClassName}
        />
      </Col>
      <Col span={12}>
        <FormattedCaps {...this.props}
          title={capsUUID ? this.sessionFromUUID(capsUUID).name : null}
        />
      </Col>
    </Row>);
  }
}
