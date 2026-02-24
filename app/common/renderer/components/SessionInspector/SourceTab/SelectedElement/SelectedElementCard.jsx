import {IconDownload, IconFiles, IconTag} from '@tabler/icons-react';
import {Button, Card, Flex, Tooltip} from 'antd';
import {useTranslation} from 'react-i18next';

import {downloadFile} from '../../../../utils/file-handling.js';
import {copyToClipboard} from '../../../../utils/other.js';
import styles from './SelectedElement.module.css';

/**
 * Title of the selected element's wrapper card, with its dedicated icon.
 */
const SelectedElementPanelTitle = () => {
  const {t} = useTranslation();
  return (
    <Flex gap={4} align="center">
      <IconTag size={18} />
      {t('selectedElement')}
    </Flex>
  );
};

/**
 * Buttons shown in the selected element's wrapper card.
 */
const SelectedElementHeaderButtons = ({
  elementAttributesData,
  elementActionsDisabled,
  selectedElementId,
  applyClientMethod,
}) => {
  const {t} = useTranslation();

  const downloadElementScreenshot = async (elementId) => {
    const elemScreenshot = await applyClientMethod({
      methodName: 'takeElementScreenshot',
      elementId,
      skipRefresh: true,
    });
    const href = `data:image/png;base64,${elemScreenshot}`;
    const filename = `element-${elementId}.png`;
    downloadFile(href, filename);
  };

  return (
    <span>
      <Tooltip title={t('Copy Attributes to Clipboard')}>
        <Button
          type="text"
          disabled={elementActionsDisabled}
          id="btnCopyAttributes"
          icon={<IconFiles size={18} />}
          onClick={() => copyToClipboard(JSON.stringify(elementAttributesData))}
        />
      </Tooltip>
      <Tooltip title={t('Download Screenshot')}>
        <Button
          type="text"
          disabled={elementActionsDisabled}
          icon={<IconDownload size={18} />}
          id="btnDownloadElemScreenshot"
          onClick={() => downloadElementScreenshot(selectedElementId)}
        />
      </Tooltip>
    </span>
  );
};

/**
 * The selected element panel's wrapper card, with title and action buttons.
 */
const SelectedElementCard = ({
  applyClientMethod,
  selectedElementId,
  elementActionsDisabled,
  elementAttributesData,
  children,
}) => (
  <Card
    title={<SelectedElementPanelTitle />}
    className={styles.selectedElementCard}
    extra={
      <SelectedElementHeaderButtons
        elementAttributesData={elementAttributesData}
        elementActionsDisabled={elementActionsDisabled}
        selectedElementId={selectedElementId}
        applyClientMethod={applyClientMethod}
      />
    }
  >
    {children}
  </Card>
);

export default SelectedElementCard;
