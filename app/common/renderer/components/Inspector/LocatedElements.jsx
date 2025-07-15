import {AimOutlined, ClearOutlined, MenuUnfoldOutlined, SendOutlined} from '@ant-design/icons';
import {Alert, Badge, Button, Input, List, Row, Space, Spin, Tooltip} from 'antd';
import {useRef} from 'react';

import {ALERT} from '../../constants/antd-types';
import InspectorStyles from './Inspector.module.css';

const LocatedElements = (props) => {
  const {
    locatedElements,
    locatedElementsExecutionTime,
    applyClientMethod,
    setLocatorTestElement,
    locatorTestElement,
    isFindingLocatedElementInSource,
    searchedForElementBounds,
    selectLocatedElement,
    sourceJSON,
    sourceXML,
    locatorTestStrategy,
    locatorTestValue,
    t,
  } = props;

  const sendKeys = useRef(null);

  const showIdAutocompleteInfo = () => {
    const {automationName, sessionSettings} = props;
    if (
      automationName === 'uiautomator2' &&
      locatorTestStrategy === 'id' &&
      !locatorTestValue.includes(':id/') &&
      !sessionSettings.disableIdLocatorAutocompletion
    ) {
      return (
        <Row>
          <Alert message={t('idAutocompletionCanBeDisabled')} type={ALERT.INFO} showIcon />
        </Row>
      );
    }
  };

  return (
    <>
      {locatedElements.length === 0 && (
        <Space className={InspectorStyles.spaceContainer} direction="vertical" size="small">
          <Row>
            <i>{t('couldNotFindAnyElements')}</i>
          </Row>
          <Row>
            {t('locatorStrategy')} {locatorTestStrategy}
            <br />
            {t('selector')} {locatorTestValue}
          </Row>
          {showIdAutocompleteInfo()}
        </Space>
      )}
      {locatedElements.length > 0 && (
        <Spin spinning={isFindingLocatedElementInSource}>
          <Space className={InspectorStyles.spaceContainer} direction="vertical" size="small">
            <Row justify="space-between">
              <span>
                {t('elementsCount')} <Badge count={locatedElements.length} offset={[0, -2]} />
              </span>
              <>
                {t('Time')}: {locatedElementsExecutionTime}
              </>
            </Row>
            <Row>
              <List
                className={InspectorStyles.searchResultsList}
                size="small"
                dataSource={locatedElements}
                renderItem={(elementId) => (
                  <List.Item
                    type="text"
                    {...(locatorTestElement === elementId
                      ? {className: InspectorStyles.searchResultsSelectedItem}
                      : {})}
                    {...(locatorTestElement !== elementId
                      ? {
                          onClick: () => {
                            setLocatorTestElement(elementId);
                          },
                        }
                      : {})}
                  >
                    {elementId}
                  </List.Item>
                )}
              />
            </Row>
            <Row justify="center">
              <Space direction="horizontal" size="small">
                <Tooltip title={t('Find and Select in Source')} placement="bottom">
                  <Button
                    disabled={!locatorTestElement}
                    icon={<MenuUnfoldOutlined />}
                    onClick={() =>
                      selectLocatedElement(
                        sourceJSON,
                        sourceXML,
                        searchedForElementBounds,
                        locatorTestElement,
                      )
                    }
                  />
                </Tooltip>
                <Tooltip title={t('Tap')} placement="bottom">
                  <Button
                    disabled={!locatorTestElement}
                    icon={<AimOutlined />}
                    onClick={() =>
                      applyClientMethod({methodName: 'click', elementId: locatorTestElement})
                    }
                  />
                </Tooltip>
                <Button.Group className={InspectorStyles.searchResultsActions}>
                  <Input
                    className={InspectorStyles.searchResultsKeyInput}
                    disabled={!locatorTestElement}
                    placeholder={t('Enter Keys to Send')}
                    allowClear={true}
                    onChange={(e) => (sendKeys.current = e.target.value)}
                  />
                  <Tooltip title={t('Send Keys')} placement="bottom">
                    <Button
                      disabled={!locatorTestElement}
                      icon={<SendOutlined />}
                      onClick={() =>
                        applyClientMethod({
                          methodName: 'sendKeys',
                          elementId: locatorTestElement,
                          args: [sendKeys.current || ''],
                        })
                      }
                    />
                  </Tooltip>
                  <Tooltip title={t('Clear')} placement="bottom">
                    <Button
                      disabled={!locatorTestElement}
                      id="btnClearElement"
                      icon={<ClearOutlined />}
                      onClick={() =>
                        applyClientMethod({methodName: 'clear', elementId: locatorTestElement})
                      }
                    />
                  </Tooltip>
                </Button.Group>
              </Space>
            </Row>
          </Space>
        </Spin>
      )}
    </>
  );
};

export default LocatedElements;
