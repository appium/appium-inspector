import {IconEyeCode, IconFold, IconSearch} from '@tabler/icons-react';
import {Button, Input, Row, Space, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {BUTTON, ROW} from '../../../../constants/antd-types.js';
import styles from './AppSource.module.css';

/**
 * Toolbar above the source tree with collapse, attribute toggle and search.
 */
const AppSourceTreeActions = ({
  collapseAllNodes,
  toggleShowAttributes,
  showSourceAttrs,
  onSearchChange,
  searchValue,
  matchingElementsCount,
}) => {
  const {t} = useTranslation();

  return (
    <Row justify="center" type={ROW.FLEX} align="middle" className={styles.treeActions}>
      <Space.Compact>
        <Tooltip title={t('Collapse All')}>
          <Button id="btnCollapseAll" icon={<IconFold size={18} />} onClick={collapseAllNodes} />
        </Tooltip>
        <Tooltip title={t('Toggle Attributes')}>
          <Button
            id="btnToggleAttrs"
            icon={<IconEyeCode size={18} />}
            onClick={toggleShowAttributes}
            type={showSourceAttrs ? BUTTON.PRIMARY : BUTTON.DEFAULT}
          />
        </Tooltip>
      </Space.Compact>
      <Space.Compact className={styles.treeSearchInput}>
        <Input
          placeholder={t('Search Source')}
          onChange={onSearchChange}
          value={searchValue}
          allowClear
          prefix={<IconSearch size={12} />}
        />
        <Space.Addon className={styles.treeSearchInputAddon}>
          <Tooltip title={t('Matching Elements')}>{matchingElementsCount}</Tooltip>
        </Space.Addon>
      </Space.Compact>
    </Row>
  );
};

export default AppSourceTreeActions;
