import React, { useEffect, useRef, useState } from 'react';
import electron from 'electron';

import { Spin } from 'antd';
import { SCREENSHOT_INTERACTION_MODE } from '../shared';
import webSocketHandler from './WebSocketHandler';
import StreamScreen from './StreamScreen';
import Explanation from './Explanation';
import styles from './StreamScreenContainer.css';
import Menu from './Menu';
import SignIn from './SignIn';

const StreamScreenContainer = ({
  applyAppiumMethod,
  // needed for determining sessionId of Sauce
  deviceScreenSize,
  driverData: {
    client: {
      capabilities: {
        platformName,
        testobject_device_session_id = '',
        testobject_device,
      },
    },
  },
  serverData: { dataCenter, username },
  // @TODO:Temporary (?)
  signInData,
}) => {
  const { isSignedIn } = signInData;
  //=======
  // States
  //=======
  const [clientOffsets, setClientOffsets] = useState(null);
  const [isCookieRetrieved, setIsCookieRetrieved] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isMouseUsed, setIsMouseUsed] = useState(false);
  const [isTouchStarted, setIsTouchStarted] = useState(false);
  const [scaleRatio, setScaleRatio] = useState(1);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const [wsRunning, setWsRunning] = useState(false);
  const [xCo, setXCo] = useState(null);
  const [yCo, setYCo] = useState(null);

  //=====
  // Refs
  //=====
  const canvasElement = useRef(null);
  const canvasContainer = useRef(null);

  //========
  // Methods
  //========
  /**
   * Handle the swipe start
   * @param {*} e
   */
  const handleSwipeStart = (e) => {
    setIsTouchStarted(true);

    setTouchStart({
      x: Math.floor((e.clientX - clientOffsets.left) / scaleRatio),
      y: Math.floor((e.clientY - clientOffsets.top) / scaleRatio),
    });
  };
  /**
   * Handle the Swipe move
   * @param {*} e
   */
  const handleSwipeMove = (e) => {
    setXCo(e.clientX - clientOffsets.left);
    setYCo(e.clientY - clientOffsets.top);

    if (!isTouchStarted) {
      return;
    }
    setTouchEnd({
      x: Math.floor((e.clientX - clientOffsets.left) / scaleRatio),
      y: Math.floor((e.clientY - clientOffsets.top) / scaleRatio),
    });
  };
  /**
   * Handle the swipe end
   */
  const handleSwipeEnd = async () => {
    // This is a swipe
    if (touchEnd && JSON.stringify(touchStart) !== JSON.stringify(touchEnd)) {
      await applyAppiumMethod({
        methodName: SCREENSHOT_INTERACTION_MODE.SWIPE,
        args: [touchStart.x, touchStart.y, touchEnd.x, touchEnd.y],
        skipRefresh: true,
      });
    } else {
      // This is a single click
      await applyAppiumMethod({
        methodName: SCREENSHOT_INTERACTION_MODE.TAP,
        args: [touchStart.x, touchStart.y],
        skipRefresh: true,
      });
    }
    // Now reset
    setTouchStart(null);
    setTouchEnd(null);
  };
  /**
   * When to show the touch dot
   */
  const onPointerEnter = () => setIsMouseUsed(true);
  /**
   * Reset data when mouse is out of the canvas
   */
  const onPointerLeave = () => setIsMouseUsed(false);
  /**
   * Get the ratio
   * @returns {number}
   */
  const getCanvasData = () => {
    // For some reason the deviceScreenSize is not always set
    if (canvasContainer.current && deviceScreenSize) {
      const { innerHeight } = window;
      const { top, left } = canvasContainer.current.getBoundingClientRect();
      // the 12 is for a bottom space
      const canvasHeight = innerHeight - top - 12;
      const ratio =
        canvasHeight >= deviceScreenSize.height
          ? 1
          : canvasHeight / deviceScreenSize.height;

      return { top, left, ratio };
    }

    return { top: 0, left: 0, ratio: 0.8 };
  };
  /**
   * Get and set the `sl-auth` cookie by authenticating
   *
   * @param {object} param0
   * @param {string} param0.password
   * @param {string} param0.username
   */
  const authenticate = async ({ password, username }) => {
    const { setSignedIn, setSignInError } = signInData;
    setSignInError(false);
    if (!password || !username) {
      return 'no-data';
    }

    setIsAuthenticating(true);
    const authenticationUrl =
      'https://accounts.saucelabs.com/am/json/realms/root/realms/authtree/authenticate';
    try {
      const authResp = await fetch(authenticationUrl, {
        method: 'post',
        credentials: 'omit',
        headers: {
          'X-OpenAM-Username': username,
          'X-OpenAM-Password': password,
          'x-requested-with': 'XMLHttpRequest',
          'Cache-Control': 'no-store',
        },
      });
      const { code, tokenId } = await authResp.json();
      console.log('status = ', status);
      if (code === 401) {
        setSignInError(true);
        setIsAuthenticating(false);
        return;
      }
      const cookie = {
        // Make this dc dependent
        url: `https://api.${dataCenter}.saucelabs.com`,
        name: 'sl-auth',
        value: tokenId,
        domain: '.saucelabs.com',
        path: '/',
        expires: 'session',
        httpOnly: true,
        secure: true,
        sameSite: 'no_restriction',
      };
      await electron.remote.session.defaultSession.cookies.set(cookie);
      setSignedIn(true);
      setIsAuthenticating(false);
      setIsCookieRetrieved(true);
    } catch (e) {
      setSignInError(true);
      setSignedIn(false);
      console.log(
        'Sauce Labs Video Stream Authentication and or cookie error = ',
        e
      );
    }
  };

  //========
  // Effects
  //========
  // @TODO: Temporary disabled in favor of the authenticate method
  // useEffect(() => {
  //   (async () => {
  //     if (password) {
  //       await authenticate({ username, password });
  //     }
  //   })();
  // }, []);
  /**
   * Start and handle the websocket connection and create the video stream
   */
  webSocketHandler({
    canvasElement,
    clientOffsets,
    dataCenter,
    deviceScreenSize,
    getCanvasData,
    // @TODO: Temporary (?)
    isCookieRetrieved: isCookieRetrieved || isSignedIn,
    setClientOffsets,
    scaleRatio,
    setScaleRatio,
    setWsRunning,
    sessionId: testobject_device_session_id,
  });

  return (
    <>
      {
        // @TODO: Temporary (?)
        !isSignedIn ? (
          <div className={styles.sauceSpinner}>
            <Spin size="large" spinning={isAuthenticating}>
              <SignIn
                serverData={{ username, password: signInData.password }}
                signInData={{ authenticate, ...signInData }}
              />
            </Spin>
          </div>
        ) : (isSignedIn && wsRunning) || (isCookieRetrieved && wsRunning) ? (
          <div className={styles.streamScreenContainer}>
            <StreamScreen
              applyAppiumMethod={applyAppiumMethod}
              canvasContainerRef={canvasContainer}
              canvasElementRef={canvasElement}
              handleSwipeEnd={handleSwipeEnd}
              handleSwipeMove={handleSwipeMove}
              handleSwipeStart={handleSwipeStart}
              isMouseUsed={isMouseUsed}
              mouseCoordinates={{ xCo, yCo }}
              onPointerEnter={onPointerEnter}
              onPointerLeave={onPointerLeave}
            />
            <Menu
              applyAppiumMethod={applyAppiumMethod}
              platformName={platformName}
            />
            <Explanation />
          </div>
        ) : (
          <div className={styles.sauceSpinner}>
            <Spin size="large" />
          </div>
        )
      }
    </>
  );
};

export default StreamScreenContainer;
