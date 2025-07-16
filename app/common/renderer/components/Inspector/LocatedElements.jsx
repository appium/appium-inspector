import {AimOutlined, ClearOutlined, MenuUnfoldOutlined, SendOutlined} from '@ant-design/icons';
import {Alert, Badge, Button, Input, Row, Space, Spin, Table, Tooltip} from 'antd';
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
              <Table
                pagination={false}
                className={InspectorStyles.searchResultsList}
                dataSource={locatedElements.map((elementId) => ({
                  key: elementId,
                  id: elementId,
                }))}
                columns={[
                  {
                    dataIndex: 'id',
                  },
                ]}
                showHeader={false}
                onRow={(row) => ({
                  onClick: () => locatorTestElement !== row.key && setLocatorTestElement(row.key),
                })}
                rowSelection={{
                  selectedRowKeys: [locatorTestElement],
                  hideSelectAll: true,
                  columnWidth: 0,
                  renderCell: () => null,
                }}
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
                      applyClientMethod({methodName: 'elementClick', elementId: locatorTestElement})
                    }
                  />
                </Tooltip>
                <Space.Compact className={InspectorStyles.searchResultsActions}>
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
                          methodName: 'elementSendKeys',
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
                        applyClientMethod({
                          methodName: 'elementClear',
                          elementId: locatorTestElement,
                        })
                      }
                    />
                  </Tooltip>
                </Space.Compact>
              </Space>
            </Row>
          </Space>
        </Spin>
      )}
    </>
  );
};

export default LocatedElements;
