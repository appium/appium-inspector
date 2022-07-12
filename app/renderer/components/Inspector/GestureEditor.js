import React, { Component } from 'react';
import { Row, Col, Typography, Button, Tabs } from 'antd';
import { ArrowLeftOutlined, PlayCircleOutlined } from '@ant-design/icons';
import InspectorStyles from './Inspector.css';
import { withTranslation } from '../../util';

const {Title} = Typography;
const {TabPane} = Tabs;


class GestureEditor extends Component {

  render () {

    console.log(this.props.loadedGesture);

    return <>
      <Row align="middle" gutter={[8, 24]}>
        <Col span={17}>
          <Row>
            <Button type="link" icon={<ArrowLeftOutlined />}></Button>
            <Title editable level={3}>Zoom In</Title>
          </Row>
        </Col>
        <Col span={7}>
          <Row justify='space-evenly'>
              <Button>Save</Button>
              <Button>Save As</Button>
          </Row>
        </Col>

        <Col span={22}>
          <div style={{background: '#0092ff', padding: '15px 0'}}></div>
        </Col>
        <Col span={2}>
          <Row justify='end'>
            <Button type="primary" icon={<PlayCircleOutlined />}></Button>
          </Row>
        </Col>

        <div>
          <Tabs type="card">
            <TabPane tab="Pointer 1" key="1">
              <p>Content of Tab Pane 1</p>
              <p>Content of Tab Pane 1</p>
              <p>Content of Tab Pane 1</p>
            </TabPane>
            <TabPane tab="Pointer 2" key="2">
              <p>Content of Tab Pane 2</p>
              <p>Content of Tab Pane 2</p>
              <p>Content of Tab Pane 2</p>
            </TabPane>
            <TabPane tab="Pointer 3" key="3">
              <p>Content of Tab Pane 3</p>
              <p>Content of Tab Pane 3</p>
              <p>Content of Tab Pane 3</p>
            </TabPane>
          </Tabs>
        </div>
      </Row>
      <Row align="middle">
        <Col span={2}></Col>
        <Col span={4}>TICK 1</Col>
        <Col span={4}>TICK 2</Col>
        <Col span={4}>TICK 3</Col>
        <Col span={4}>TICK 4</Col>
        <Col span={4}>TICK 5</Col>
        <Col span={2}></Col>
      </Row>
    </>;
  }
}

export default withTranslation(GestureEditor);