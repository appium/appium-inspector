import React, { Component } from 'react';
import moment from 'moment';
import { Button, Row, Col, Table } from 'antd';
import FormattedCaps from './FormattedCaps';
import SessionStyles from './Session.css';
import {
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const DATE_COLUMN_WIDTH = '25%';
const ACTIONS_COLUMN_WIDTH = '106px';

export default class SavedSessions extends Component {

  constructor (props) {
    super(props);
    this.onRow = this.onRow.bind(this);
    this.getRowClassName = this.getRowClassName.bind(this);
  }

  onRow (record) {
    return {
      onClick: () => {
        this.handleCapsAndServer(record.key);
      }
    };
  }

  getRowClassName (record) {
    const {capsUUID} = this.props;
    return capsUUID === record.key ? SessionStyles.selected : '';
  }

  handleCapsAndServer (uuid) {
    const {setCapsAndServer, server, serverType } = this.props;
    const session = this.sessionFromUUID(uuid);

    // Incase user has CAPS saved from older version of Inspector which
    // doesn't contain server and serverType within the session object
    setCapsAndServer(session.server || server, session.serverType || serverType, session.caps, session.uuid, session.name);
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
      key: 'date',
      width: DATE_COLUMN_WIDTH
    }, {
      title: 'Actions',
      key: 'action',
      width: ACTIONS_COLUMN_WIDTH,
      render: (text, record) => <div>
        <Button
          icon={<EditOutlined/>}
          onClick={() => {this.handleCapsAndServer(record.key); switchTabs('new');}}
          className={SessionStyles.editSession}
        />
        <Button
          icon={<DeleteOutlined/>}
          onClick={this.handleDelete(record.key)}/>
      </div>
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
          sticky={true}
          dataSource={dataSource}
          columns={columns}
          onRow={this.onRow}
          rowClassName={this.getRowClassName}
        />
      </Col>
      <Col span={12} className={SessionStyles.capsFormattedCol}>
        <FormattedCaps {...this.props}
          title={capsUUID ? this.sessionFromUUID(capsUUID).name : null}
        />
      </Col>
    </Row>);
  }
}
