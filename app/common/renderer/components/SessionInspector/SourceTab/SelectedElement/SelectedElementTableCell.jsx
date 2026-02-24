import {Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {copyToClipboard} from '../../../../utils/other.js';
import inspectorStyles from '../../SessionInspector.module.css';
import styles from './SelectedElement.module.css';

/**
 * Generic cell component for the selected element's tables. Can optionally be copyable.
 */
const SelectedElementTableCell = ({text, isCopyable}) => {
  const {t} = useTranslation();
  const monoText = <span className={inspectorStyles.monoFont}>{text}</span>;

  const cellContent = isCopyable ? (
    <Tooltip title={t('Copied!')} trigger="click">
      <span className={styles.copyableCell} onClick={() => copyToClipboard(text)}>
        {monoText}
      </span>
    </Tooltip>
  ) : (
    monoText
  );

  return <div className={styles.selectedElemTableCells}>{cellContent}</div>;
};

export default SelectedElementTableCell;
