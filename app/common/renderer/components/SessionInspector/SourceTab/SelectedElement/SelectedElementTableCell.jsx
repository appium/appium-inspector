import {Tooltip} from 'antd';
import {useEffect, useRef, useState} from 'react';
import {useTranslation} from 'react-i18next';

import {CLIPBOARD_COPY_STATUS, copyToClipboardSafely} from '../../../../utils/other.js';

import inspectorStyles from '../../SessionInspector.module.css';
import styles from './SelectedElement.module.css';

/**
 * Generic cell component for the selected element's tables. Can optionally be copyable.
 */
export const getClipboardFeedback = (copyResult, t) =>
  copyResult.status === CLIPBOARD_COPY_STATUS.SUCCESS
    ? {title: t('Copied!'), color: 'green'}
    : {title: t('Copy failed'), color: 'red'};

export const handleCopyCellClick = (event, copyText) => {
  event.stopPropagation();
  return copyText();
};

const SelectedElementTableCell = ({text, isCopyable}) => {
  const {t} = useTranslation();
  const [copyFeedback, setCopyFeedback] = useState(null);
  const [isCopying, setIsCopying] = useState(false);
  const copyRequestId = useRef(0);
  const currentText = useRef(text);
  currentText.current = text;
  const monoText = <span className={inspectorStyles.monoFont}>{text}</span>;

  useEffect(() => {
    copyRequestId.current += 1;
    setCopyFeedback(null);
    setIsCopying(false);
  }, [text]);

  const copyText = async () => {
    const requestId = ++copyRequestId.current;
    setCopyFeedback(null);
    setIsCopying(true);
    const result = await copyToClipboardSafely(text);
    if (requestId !== copyRequestId.current || text !== currentText.current) {
      return;
    }
    setCopyFeedback(getClipboardFeedback(result, t));
    setIsCopying(false);
  };

  const cellContent = isCopyable ? (
    <Tooltip
      title={copyFeedback?.title}
      color={copyFeedback?.color}
      trigger="click"
      open={copyFeedback !== null}
      onOpenChange={(open) => !open && setCopyFeedback(null)}
    >
      <button
        type="button"
        className={styles.copyableCell}
        aria-label={t('Copy to clipboard')}
        disabled={isCopying}
        onClick={(event) => handleCopyCellClick(event, copyText)}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {monoText}
      </button>
    </Tooltip>
  ) : (
    monoText
  );

  return <div className={styles.selectedElemTableCells}>{cellContent}</div>;
};

export default SelectedElementTableCell;
