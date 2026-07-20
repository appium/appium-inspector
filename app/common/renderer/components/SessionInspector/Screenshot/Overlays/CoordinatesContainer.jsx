import {useTranslation} from 'react-i18next';

import styles from './Overlays.module.css';

/**
 * A box overlay shown in the top left corner of the app screenshot,
 * showing the current screen coordinates.
 */
const CoordinatesContainer = ({x, y}) => {
  const {t} = useTranslation();

  return (
    <div className={styles.coordinatesContainer}>
      <p>{t('xCoordinate', {x})}</p>
      <p>{t('yCoordinate', {y})}</p>
    </div>
  );
};

export default CoordinatesContainer;
