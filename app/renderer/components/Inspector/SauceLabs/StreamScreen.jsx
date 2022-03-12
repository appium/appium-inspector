import React, { useCallback, useEffect } from 'react';
import { Spin } from 'antd';
import { SCREENSHOT_INTERACTION_MODE } from '../shared';
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
  canvasLoaded,
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
    event.stopPropagation();
    const KEY_CODES = {
      arrowLeft: 'ArrowLeft',
      arrowRight: 'ArrowRight',
      backspace: 'Backspace',
      enter: 'Enter',
    };
    // Some special events need special codes
    if (
      event.key.length === 1 ||
      Object.values(KEY_CODES).includes(event.key)
    ) {
      let key;
      switch (event.key) {
        case KEY_CODES.arrowLeft:
          key = '\uE012';
          break;
        case KEY_CODES.arrowRight:
          key = '\uE014';
          break;
        case KEY_CODES.backspace:
          key = '\uE003';
          break;
        case KEY_CODES.enter:
          key = '\uE007';
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

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <Spin size="large" spinning={!canvasLoaded}>
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
    </Spin>
  );
};

export default StreamScreen;
