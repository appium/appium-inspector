import React from 'react';
import { Tooltip } from 'antd';
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import styles from './Menu.css';

/**
 * The Sauce Real Device interaction Menu
 * @param {object} param0
 * @param {function} param0.applyAppiumMethod
 * @param {string} param0.platformName
 * @returns
 */
const Menu = ({ applyAppiumMethod, platformName }) => {
  const isIOS = platformName.toLowerCase() == 'ios';
  const isAndroid = !isIOS;
  const ANDROID_KEYCODE = {
    HOME: 3,
    BACK: 4,
    RECENT_APPS: 187,
  };
  const pressHomeButton = async () => {
    if (isIOS) {
      return applyAppiumMethod({
        methodName: 'executeScript',
        args: ['mobile: pressButton', [{ name: 'home' }]],
        skipRefresh: true,
      });
    }

    await applyAppiumMethod({
      methodName: 'pressKeyCode',
      args: [ANDROID_KEYCODE.HOME],
      skipRefresh: true,
    });
  };
  const pressBackButton = async () => {
    await applyAppiumMethod({
      methodName: 'pressKeyCode',
      args: [ANDROID_KEYCODE.BACK],
      skipRefresh: true,
    });
  };
  const pressRecentAppsButton = async () => {
    await applyAppiumMethod({
      methodName: 'pressKeyCode',
      args: [ANDROID_KEYCODE.RECENT_APPS],
      skipRefresh: true,
    });
  };
  return (
    <div className={styles.menuContainer}>
      <div className={styles.header}>
        <Tooltip title="Device Menu">
          <MenuOutlined />
        </Tooltip>
      </div>
      <div className={styles.content}>
        <div className={styles.row}>
          <Tooltip title="Device Home Button">
            <button className={styles.menuButton} onClick={pressHomeButton}>
              <HomeOutlined />
            </button>
          </Tooltip>
          {isAndroid && (
            <>
              <Tooltip title="Device Back Button">
                <button className={styles.menuButton} onClick={pressBackButton}>
                  <ArrowLeftOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Device Recent App Button">
                <button
                  className={styles.menuButton}
                  onClick={pressRecentAppsButton}
                >
                  <AppstoreOutlined />
                </button>
              </Tooltip>
            </>
          )}
        </div>
      </div>
      <div className={styles.footer}></div>
    </div>
  );
};

export default Menu;
