import {IconEraser, IconFocus2, IconListSearch, IconSend2} from '@tabler/icons-react';
import {Alert, Badge, Button, Col, Input, Row, Space, Spin, Table, Tooltip} from 'antd';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';

import {ALERT} from '../../../../constants/antd-types.js';
import inspectorStyles from '../../SessionInspector.module.css';
import styles from './LocatorSearch.module.css';

const LocatorSearchResults = (props) => {
  const {
    locatedElements,
    locatedElementsExecutionTime,
    applyClientMethod,
    selectLocatedElement,
    locatedElement,
    isFindingLocatedElementInSource,
    searchedForElementBounds,
    findLocatedElementInSource,
    sourceJSON,
    sourceXML,
    locatorSearchStrategy,
    locatorSearchValue,
  } = props;
  const {t} = useTranslation();

  const sendKeysRef = useRef(null);

  const showIdAutocompleteInfo = () => {
    const {automationName, sessionSettings} = props;
    if (
      automationName === 'uiautomator2' &&
      locatorSearchStrategy === 'id' &&
      !locatorSearchValue.includes(':id/') &&
      !sessionSettings.disableIdLocatorAutocompletion
    ) {
      return (
        <Row>
          <Alert title={t('idAutocompletionCanBeDisabled')} type={ALERT.INFO} showIcon />
        </Row>
      );
    }
  };

  return (
    <>
      {locatedElements.length === 0 && (
        <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="small">
          <Row>
            <i>{t('couldNotFindAnyElements')}</i>
          </Row>
          <Row>
            <Col span={6}>{t('locatorStrategy')}</Col>
            <Col span={18}>
              <span className={inspectorStyles.monoFont}>{locatorSearchStrategy}</span>
            </Col>
          </Row>
          <Row>
            <Col span={6}>{t('selector')}</Col>
            <Col span={18}>
              <span className={inspectorStyles.monoFont}>{locatorSearchValue}</span>
            </Col>
          </Row>
          {showIdAutocompleteInfo()}
        </Space>
      )}
      {locatedElements.length > 0 && (
        <Spin spinning={isFindingLocatedElementInSource}>
          <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="small">
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
                className={styles.searchResultsList}
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
                  onClick: () => locatedElement !== row.key && selectLocatedElement(row.key),
                })}
                rowSelection={{
                  selectedRowKeys: [locatedElement],
                  hideSelectAll: true,
                  columnWidth: 0,
                  renderCell: () => null,
                }}
              />
            </Row>
            <Row justify="center">
              <Space orientation="horizontal" size="small">
                <Tooltip title={t('Find and Select in Source')} placement="bottom">
                  <Button
                    disabled={!locatedElement}
                    icon={<IconListSearch size={18} />}
                    onClick={() =>
                      findLocatedElementInSource(
                        sourceJSON,
                        sourceXML,
                        searchedForElementBounds,
                        locatedElement,
                      )
                    }
                  />
                </Tooltip>
                <Tooltip title={t('Tap')} placement="bottom">
                  <Button
                    disabled={!locatedElement}
                    icon={<IconFocus2 size={18} />}
                    onClick={() =>
                      applyClientMethod({methodName: 'elementClick', elementId: locatedElement})
                    }
                  />
                </Tooltip>
                <Space.Compact className={styles.searchResultsActions}>
                  <Input
                    className={styles.searchResultsKeyInput}
                    disabled={!locatedElement}
                    placeholder={t('Enter Keys to Send')}
                    allowClear={true}
                    onChange={(e) => (sendKeysRef.current = e.target.value)}
                  />
                  <Tooltip title={t('Send Keys')} placement="bottom">
                    <Button
                      disabled={!locatedElement}
                      icon={<IconSend2 size={18} />}
                      onClick={() =>
                        applyClientMethod({
                          methodName: 'elementSendKeys',
                          elementId: locatedElement,
                          args: [sendKeysRef.current || ''],
                        })
                      }
                    />
                  </Tooltip>
                  <Tooltip title={t('Clear')} placement="bottom">
                    <Button
                      disabled={!locatedElement}
                      id="btnClearElement"
                      icon={<IconEraser size={18} />}
                      onClick={() =>
                        applyClientMethod({
                          methodName: 'elementClear',
                          elementId: locatedElement,
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

export default LocatorSearchResults;
