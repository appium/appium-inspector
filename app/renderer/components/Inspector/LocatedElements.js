import React, { Component } from 'react';
import { Alert, Input, Row, Button, Badge, List, Space, Spin, Tooltip } from 'antd';
import { AimOutlined, ClearOutlined, SendOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { ALERT } from '../AntdTypes';
import InspectorStyles from './Inspector.css';
import { withTranslation } from '../../util';

const ButtonGroup = Button.Group;

const showIdAutocompleteInfo = (driver, strategy, value, t) => {
  const automationName = driver.client.capabilities.automationName;
  const idLocatorAutocompletionDisabled = driver.client.capabilities.disableIdLocatorAutocompletion;
  if (automationName && automationName.toLowerCase() === 'uiautomator2' &&
    strategy === 'id' && !value.includes(':id/') && !idLocatorAutocompletionDisabled) {
    return <Row><Alert message={t('idAutocompletionCanBeDisabled')} type={ALERT.INFO} showIcon/></Row>;
  }
};

class LocatedElements extends Component {

  render () {
    const {
      locatedElements,
      locatedElementsExecutionTime,
      applyClientMethod,
      locatorTestStrategy,
      locatorTestValue,
      setLocatorTestElement,
      locatorTestElement,
      isFindingLocatedElementInSource,
      searchedForElementBounds,
      selectLocatedElement,
      source,
      driver,
      t,
    } = this.props;

    return <>
      {locatedElements.length === 0 && <Space className={InspectorStyles.spaceContainer} direction='vertical' size='small'>
        <Row><i>{t('couldNotFindAnyElements')}</i></Row>
        {showIdAutocompleteInfo(driver, locatorTestStrategy, locatorTestValue, t)}
      </Space>}
      {locatedElements.length > 0 && <Spin spinning={isFindingLocatedElementInSource}>
        <Space className={InspectorStyles.spaceContainer} direction='vertical' size='small'>
          <Row justify='space-between'>
            <span>{t('elementsCount')} <Badge count={locatedElements.length} offset={[0, -2]}/></span>
            <>{t('Time')}: {locatedElementsExecutionTime}</>
          </Row>
          <Row>
            <List className={InspectorStyles.searchResultsList}
              size='small'
              dataSource={locatedElements}
              renderItem={(elementId) =>
                <List.Item type='text'
                  {...(locatorTestElement === elementId ? { className: InspectorStyles.searchResultsSelectedItem } : {})}
                  {...(locatorTestElement !== elementId ? { onClick: () => {setLocatorTestElement(elementId);} } : {})}
                >
                  {elementId}
                </List.Item>
              }
            />
          </Row>
          <Row justify='center'>
            <Space direction='horizontal' size='small'>
              <Tooltip title={t('Find and Select in Source')} placement='bottom'>
                <Button
                  disabled={!locatorTestElement}
                  icon={<MenuUnfoldOutlined/>}
                  onClick={() => selectLocatedElement(source, searchedForElementBounds, locatorTestElement)}
                />
              </Tooltip>
              <Tooltip title={t('Tap')} placement='bottom'>
                <Button
                  disabled={!locatorTestElement}
                  icon={<AimOutlined/>}
                  onClick={() => applyClientMethod({methodName: 'click', elementId: locatorTestElement})}
                />
              </Tooltip>
              <ButtonGroup className={InspectorStyles.searchResultsActions}>
                <Input className={InspectorStyles.searchResultsKeyInput}
                  disabled={!locatorTestElement}
                  placeholder={t('Enter Keys to Send')}
                  allowClear={true}
                  onChange={(e) => this.setState({sendKeys: e.target.value})}/>
                <Tooltip title={t('Send Keys')} placement='bottom'>
                  <Button
                    disabled={!locatorTestElement}
                    icon={<SendOutlined/>}
                    onClick={() => applyClientMethod({methodName: 'sendKeys', elementId: locatorTestElement, args: [this.state.sendKeys || '']})}
                  />
                </Tooltip>
                <Tooltip title={t('Clear')} placement='bottom'>
                  <Button
                    disabled={!locatorTestElement}
                    id='btnClearElement'
                    icon={<ClearOutlined/>}
                    onClick={() => applyClientMethod({methodName: 'clear', elementId: locatorTestElement})}
                  />
                </Tooltip>
              </ButtonGroup>
            </Space>
          </Row>
        </Space>
      </Spin>}
    </>;
  }
}

export default withTranslation(LocatedElements);
