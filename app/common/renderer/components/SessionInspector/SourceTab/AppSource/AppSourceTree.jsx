import {CaretDownOutlined} from '@ant-design/icons';
import {Dropdown, Tree} from 'antd';
import {useTranslation} from 'react-i18next';

import {SOURCE_EXPANSION_LEVELS, SOURCE_EXPANSION_LIMIT} from '../../../../utils/source-tree-expansion.js';

import styles from './AppSource.module.css';

/**
 * Source tree display with controlled expand/select state.
 */
const AppSourceTree = ({
  treeData,
  expandNode,
  expandBranch,
  expandedKeys,
  autoExpandParent,
  selectElement,
  unselectElement,
  selectedElementPath,
}) => {
  const {t} = useTranslation();
  const handleSelectElement = (path) => {
    if (!path) {
      unselectElement();
    } else {
      selectElement(path);
    }
  };

  return (
    <Tree
      defaultExpandAll={true}
      showLine={true}
      switcherIcon={({expanded}) => (
        <CaretDownOutlined
          style={{
            transform: `rotate(${expanded ? 0 : -90}deg)`,
            transition: 'transform 0.3s',
          }}
        />
      )}
      onExpand={expandNode}
      expandedKeys={expandedKeys}
      autoExpandParent={autoExpandParent}
      onSelect={(selectedPaths) => handleSelectElement(selectedPaths[0])}
      selectedKeys={[selectedElementPath]}
      treeData={treeData}
      titleRender={(node) => (
        <Dropdown
          trigger={['contextMenu']}
          menu={{
            items: [
              {
                key: 'expandBranch',
                label: t('expandSourceBranch', {
                  levels: SOURCE_EXPANSION_LEVELS,
                  branches: SOURCE_EXPANSION_LIMIT,
                }),
                disabled: !node.children?.length,
              },
            ],
            onClick: ({key, domEvent}) => {
              domEvent.stopPropagation();
              if (key === 'expandBranch') {
                expandBranch(node);
              }
            },
          }}
        >
          <span>{node.title}</span>
        </Dropdown>
      )}
      className={styles.sourceTree}
    />
  );
};

export default AppSourceTree;
