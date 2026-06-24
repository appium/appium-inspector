import {CaretDownOutlined} from '@ant-design/icons';
import {Tree} from 'antd';

import styles from './AppSource.module.css';

/**
 * Source tree display with controlled expand/select state.
 */
const AppSourceTree = ({
  treeData,
  expandNode,
  expandedKeys,
  autoExpandParent,
  selectElement,
  unselectElement,
  selectedElementPath,
}) => {
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
      className={styles.sourceTree}
    />
  );
};

export default AppSourceTree;
