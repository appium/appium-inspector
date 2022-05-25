import React, { Component } from 'react';
import { Card, Tooltip, Button, Select } from 'antd';
import { CopyOutlined, CodeOutlined } from '@ant-design/icons';
import { withTranslation } from '../../util';
import InspectorStyles from './Inspector.css';
import frameworks from '../../lib/client-frameworks';
import { highlight } from 'highlight.js';
import { clipboard } from '../../polyfills';

const Option = Select.Option;

class SessionCodeBox extends Component {

  code () {
    let { sessionDetails, actionFramework } = this.props;
    let {host, port, path, https, desiredCapabilities} = sessionDetails;

    let framework = new frameworks[actionFramework](host, port, path,
      https, desiredCapabilities);
    let rawCode = framework.getCodeString(true);

    return highlight(framework.language, rawCode, true).value;
  }

  actionBar () {
    const { setActionFramework, actionFramework, t } = this.props;

    let frameworkOpts = Object.keys(frameworks).map(
      (f) => <Option value={f} key={f}>
        {frameworks[f].readableName}
      </Option>);

    return <div>
      <Select defaultValue={actionFramework} onChange={setActionFramework}
        className={InspectorStyles['framework-dropdown']} size="small">
        {frameworkOpts}
      </Select>
      <Tooltip title={t('Copy Code to Clipboard')}>
        <Button
          icon={<CopyOutlined/>}
          onClick={() => clipboard.writeText(this.code())}
          type='text'
        />
      </Tooltip>
    </div>;
  }

  render () {
    const { t } = this.props;

    return <Card title={<span><CodeOutlined /> {t('Start this Kind of Session with Code')}</span>}
      className={InspectorStyles['recorded-actions']}
      extra={this.actionBar()}
    >
      <div
        className={InspectorStyles['recorded-code']}
        dangerouslySetInnerHTML={{__html: this.code()}} />

    </Card>;
  }
}

export default withTranslation(SessionCodeBox);