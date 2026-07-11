import {IconEraser, IconFocus2, IconListSearch, IconSend2} from '@tabler/icons-react';
import {Badge, Button, Input, Row, Space, Spin, Table, Tooltip} from 'antd';
import {useRef} from 'react';
import {useTranslation} from 'react-i18next';

import inspectorStyles from '../../SessionInspector.module.css';
import styles from './LocatorSearch.module.css';

/**
 * Shows the number of found locators, and the time taken.
 */
const LocatorSearchResultsCountAndTime = ({locatedElements, locatedElementsExecutionTime}) => {
  const {t} = useTranslation();

  return (
    <Row justify="space-between">
      <span>
        {t('elementsCount')} <Badge count={locatedElements.length} offset={[0, -2]} />
      </span>
      <>
        {t('Time')}: {locatedElementsExecutionTime}
      </>
    </Row>
  );
};

/**
 * Table listing selectable element IDs for each found element.
 */
const LocatorSearchResultsTable = ({locatedElements, locatedElement, selectLocatedElement}) => (
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
);

/**
 * Available actions for a single selected entry among the found elements.
 */
const LocatorSearchResultsElementActions = ({
  locatedElement,
  findLocatedElementInSource,
  sourceJSON,
  sourceXML,
  searchedForElementBounds,
  applyClientMethod,
}) => {
  const {t} = useTranslation();

  const sendKeysRef = useRef(null);

  return (
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
  );
};

/**
 * Locator search results for when at least one locator was found.
 */
const LocatorSearchFoundResults = (props) => {
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
  } = props;

  return (
    <Spin spinning={isFindingLocatedElementInSource}>
      <Space className={inspectorStyles.spaceContainer} orientation="vertical" size="small">
        <LocatorSearchResultsCountAndTime
          locatedElements={locatedElements}
          locatedElementsExecutionTime={locatedElementsExecutionTime}
        />
        <LocatorSearchResultsTable
          locatedElements={locatedElements}
          locatedElement={locatedElement}
          selectLocatedElement={selectLocatedElement}
        />
        <LocatorSearchResultsElementActions
          locatedElement={locatedElement}
          findLocatedElementInSource={findLocatedElementInSource}
          sourceJSON={sourceJSON}
          sourceXML={sourceXML}
          searchedForElementBounds={searchedForElementBounds}
          applyClientMethod={applyClientMethod}
        />
      </Space>
    </Spin>
  );
};

export default LocatorSearchFoundResults;
