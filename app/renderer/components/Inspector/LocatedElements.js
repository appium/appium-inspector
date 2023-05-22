import React, { Component } from 'react';
import { clipboard } from '../../polyfills';
import { Input, Row, Button, Badge, List, Space, Tooltip } from 'antd';
import { CopyOutlined, AimOutlined, UndoOutlined } from '@ant-design/icons';
import InspectorStyles from './Inspector.css';
import { withTranslation } from '../../util';

const ButtonGroup = Button.Group;

class LocatedElements extends Component {

  onSubmit () {
    const {locatedElements, locatorTestStrategy, locatorTestValue, searchForElement, clearSearchResults, hideLocatorTestModal} = this.props;
    if (locatedElements) {
      hideLocatorTestModal();
      clearSearchResults();
    } else {
      searchForElement(locatorTestStrategy, locatorTestValue);
    }
  }

  onCancel () {
    const {hideLocatorTestModal, clearSearchResults} = this.props;
    hideLocatorTestModal();
    clearSearchResults();
  }

  render () {
    const {
      locatedElements,
      applyClientMethod,
      setLocatorTestElement,
      locatorTestElement,
      t,
    } = this.props;

    return <>
      {locatedElements.length === 0 && <Row><i>{t('couldNotFindAnyElements')}</i></Row>}
      {locatedElements.length > 0 && <Space className={InspectorStyles.spaceContainer} direction='vertical' size='small'>
        <Row><span>{t('elementsCount')} <Badge count={locatedElements.length} offset={[0, -2]}/></span></Row>
        <Row>
          <div className={InspectorStyles.searchResultsContainer}>
            <List bordered size='small'
              dataSource={locatedElements}
              renderItem={(elementId) =>
                <List.Item type='text'
                  className={locatorTestElement === elementId ? InspectorStyles.searchResultsSelectedItem : ''}
                  onClick={() => setLocatorTestElement(elementId)}
                >
                  {elementId}
                </List.Item>
              }
            />
          </div>
        </Row>
        <Row justify='center'>
          <ButtonGroup>
            <Tooltip title={t('Copy ID')} placement='bottom'>
              <Button
                disabled={!locatorTestElement}
                icon={<CopyOutlined/>}
                onClick={() => clipboard.writeText(locatorTestElement)}/>
            </Tooltip>
            <Tooltip title={t('Tap Element')} placement='bottom'>
              <Button
                disabled={!locatorTestElement}
                icon={<AimOutlined/>}
                onClick={() => applyClientMethod({methodName: 'click', elementId: locatorTestElement})}
              />
            </Tooltip>
            <Tooltip title={t('Clear')} placement='bottom'>
              <Button
                disabled={!locatorTestElement}
                id='btnClearElement'
                icon={<UndoOutlined/>}
                onClick={() => applyClientMethod({methodName: 'clear', elementId: locatorTestElement})}
              />
            </Tooltip>
          </ButtonGroup>
          <Input.Group compact>
            <Input
              disabled={!locatorTestElement}
              placeholder={t('Enter keys')}
              onChange={(e) => this.setState({...this.state, sendKeys: e.target.value})}/>
            <Button
              disabled={!locatorTestElement}
              onClick={() => applyClientMethod({methodName: 'sendKeys', elementId: locatorTestElement, args: [this.state.sendKeys || '']})}
            >
              {t('Send Keys')}
            </Button>
          </Input.Group>
          <div className={InspectorStyles['locator-test-interactions-container']}>
            <div className={InspectorStyles['send-keys-container']}>
              <Input size='small' placeholder={t('Enter keys')} onChange={(e) => this.setState({...this.state, sendKeys: e.target.value})}/>
              <Button size='small'
                disabled={!locatorTestElement}
                onClick={() => applyClientMethod({methodName: 'sendKeys', elementId: locatorTestElement, args: [this.state.sendKeys || '']})}
              >
                {t('Send Keys')}
              </Button>
            </div>
          </div>
        </Row>
      </Space>}
    </>;
  }
}

export default withTranslation(LocatedElements);
