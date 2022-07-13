import React, { Component } from 'react';
import { Form, Input, Button } from 'antd';
import { withTranslation } from '../../util';

const {Item} = Form;

class GestureEditor extends Component {

  constructor (props) {
    super(props);
    this.state = {
      x: null,
      y: null,
    };
  }

  onSave (gesture) {
    const {saveGesture, hideGestureEditor} = this.props;
    saveGesture(gesture);
    hideGestureEditor();
  }

  render () {

    return <>
      <Form
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={{ remember: true }}
        autoComplete="off"
        onFinish={(e) => this.onSave(e)}
      >
        <Item
          label="Name"
          name="name"
          rules={[{ required: true}]}
        >
          <Input />
        </Item>

        <Item
          label="Description"
          name="description"
          rules={[{ required: true}]}
        >
          <Input />
        </Item>

        <Item
          label="Pointer 1"
          name="pointer1"
          rules={[{ required: true}]}
        >
          <Input.TextArea />
        </Item>

        <Item
          label="Pointer 2"
          name="pointer2"
          rules={[{ required: true}]}
        >
          <Input.TextArea />
        </Item>

        <Item
          label="Pointer 3"
          name="pointer3"
          rules={[{ required: true}]}
        >
          <Input.TextArea />
        </Item>

        <Item
          label="Pointer 4"
          name="pointer4"
          rules={[{ required: true}]}
        >
          <Input.TextArea />
        </Item>

        <Item
          label="Pointer 5"
          name="pointer5"
          rules={[{ required: true}]}
        >
          <Input.TextArea />
        </Item>

        <Item wrapperCol={{ offset: 8, span: 16 }}>
          <Button type="primary" htmlType="submit">
          Submit
          </Button>
        </Item>
      </Form>
    </>;
  }
}

export default withTranslation(GestureEditor);