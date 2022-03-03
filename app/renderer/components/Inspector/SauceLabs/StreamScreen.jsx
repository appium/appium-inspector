import React, { useCallback, useEffect } from 'react';
import TouchDot from './TouchDot';
import styles from './StreamScreen.css';

/**
 * The video streaming screen
 *
 * @param {object} param0
 * @param {function} param0.applyAppiumMethod
 * @param {object} param0.canvasContainerRef
 * @param {object} param0.canvasElementRef
 * @param {function} param0.handleSwipeEnd
 * @param {function} param0.handleSwipeMove
 * @param {function} param0.handleSwipeStart
 * @param {object} param0.isMouseUsed
 * @param {object} param0.mouseCoordinates
 * @param {object} param0.mouseCoordinates.xCo
 * @param {object} param0.mouseCoordinates.yCo
 * @param {function} param0.onPointerEnter
 * @param {function} param0.onPointerLeave
 * @returns
 */
const StreamScreen = ({
  applyAppiumMethod,
  canvasContainerRef,
  canvasElementRef,
  handleSwipeEnd,
  handleSwipeMove,
  handleSwipeStart,
  isMouseUsed,
  mouseCoordinates: { xCo, yCo },
  onPointerEnter,
  onPointerLeave,
}) => {
  /**
   * Handle the keyDown event
   * @param {*} event
   */
  const onKeyDown = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const KEY_CODES = {
      backspace: 'Backspace',
      enter: 'Enter',
    };
    // Backspace is not being picked up, see below code to check it
    if (
      event.key.length === 1 ||
      Object.values(KEY_CODES).includes(event.key)
    ) {
      let key;
      switch (event.key) {
        case KEY_CODES.backspace:
          key = '\b';
          break;
        case KEY_CODES.enter:
          key = '\n';
          break;
        default:
          key = event.key;
          break;
      }
      await applyAppiumMethod({
        methodName: SCREENSHOT_INTERACTION_MODE.TYPE,
        args: [key],
        skipRefresh: true,
      });
    }
  }, []);
  /**
   * Add onKeydown event listener
   */
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <>
      <div className={styles.innerVideoStreamContainer}>
        <div
          ref={canvasContainerRef}
          className={styles.videoStreamBox}
          onPointerDown={handleSwipeStart}
          onPointerMove={handleSwipeMove}
          onPointerUp={handleSwipeEnd}
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
        >
          {isMouseUsed && <TouchDot xPosition={xCo} yPosition={yCo} />}
          <canvas ref={canvasElementRef} />
        </div>
      </div>
    </>
  );
};

export default StreamScreen;
