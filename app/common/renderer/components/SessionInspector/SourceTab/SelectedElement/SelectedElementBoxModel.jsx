import _ from 'lodash';
import {useTranslation} from 'react-i18next';

import {parseCoordinates} from '../../../../utils/other.js';
import inspectorStyles from '../../SessionInspector.module.css';
import styles from './SelectedElement.module.css';
import SelectedElementTable from './SelectedElementTable.jsx';

/**
 * Cell rendering the element's box model.
 */
const SelectedElementBoxModelContents = ({dataPoints}) => {
  const {x1, y1, x2, y2, xMiddle, yMiddle} = dataPoints;
  const monoText = (text) => <span className={inspectorStyles.monoFont}>{text}</span>;
  const monoCoords = (x, y) => monoText(`(${x}, ${y})`);

  return (
    <div className={styles.selectedElemBoxModelWrapper}>
      <div className={styles.selectedElemWidth}>{monoText(x2 - x1)}</div>
      <div className={styles.selectedElemHeightPlusBoxWrapper}>
        <div>{monoText(y2 - y1)}</div>
        <div className={styles.selectedElemBoxWrapper}>
          <span className={styles.selectedElemTopLeft}>{monoCoords(x1, y1)}</span>
          <span className={styles.selectedElemTopRight}>{monoCoords(x2, y1)}</span>
          <div className={styles.selectedElemMidpoint}>{monoCoords(xMiddle, yMiddle)}</div>
          <span className={styles.selectedElemBottomLeft}>{monoCoords(x1, y2)}</span>
          <span className={styles.selectedElemBottomRight}>{monoCoords(x2, y2)}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Single-cell table containing the element's box model.
 * Table is used for consistency with the other selected element items.
 */
const SelectedElementBoxModel = ({selectedElement}) => {
  const {t} = useTranslation();

  const extractedCoords = parseCoordinates(selectedElement);
  if (_.isEmpty(extractedCoords)) {
    return null;
  }
  const {x1, y1, x2, y2} = extractedCoords;
  const xMiddle = x1 + (x2 - x1) / 2;
  const yMiddle = y1 + (y2 - y1) / 2;

  const elementBoxModelData = [
    {
      key: 'data',
      boxmodel: {x1, y1, x2, y2, xMiddle, yMiddle},
    },
  ];

  const elementBoxModelCol = [
    {
      title: t('Box Model'),
      dataIndex: 'boxmodel',
      key: 'boxmodel',
      render: (dataPoints) => <SelectedElementBoxModelContents dataPoints={dataPoints} />,
    },
  ];

  return <SelectedElementTable columns={elementBoxModelCol} dataSource={elementBoxModelData} />;
};

export default SelectedElementBoxModel;
