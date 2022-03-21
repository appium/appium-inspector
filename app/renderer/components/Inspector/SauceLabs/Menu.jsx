import React, { memo, useRef, useState } from 'react';
import { Tooltip } from 'antd';
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  CameraOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  HomeOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import styles from './Menu.css';

/**
 * The Sauce Real Device interaction Menu
 *
 * @param {object} menuData
 * @param {function} menuData.applyAppiumMethod
 * @param {string} menuData.platformName
 * @param {object} translation
 * @returns
 */
const Menu = memo(({ applyAppiumMethod, platformName, translation }) => {
  const isIOS = platformName.toLowerCase() == 'ios';
  const isAndroid = !isIOS;
  const ANDROID_KEYCODE = {
    HOME: 3,
    BACK: 4,
    RECENT_APPS: 187,
  };

  const [showBiometricsModal, setShowBiometricsModal] = useState(false);
  const [showCameraInjectionModal, setShowCameraInjectionModal] =
    useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const hiddenFileInput = useRef(null);

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
  const handleUploadImageButton = () => {
    hiddenFileInput.current.click();
  };
  const handleFileUpload = async (event) => {
    setImageProcessing(true);
    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = async (fileEvent) => {
      try {
        // Remove `data:image/png;base64,` from string
        await applyAppiumMethod({
          methodName: 'executeScript',
          args: [
            `sauce:inject-image=${fileEvent.target.result.split(',').pop()}`,
            [],
          ],
          skipRefresh: true,
        });
      } catch (ign) {}
    };
    setImageProcessing(false);
    setShowCameraInjectionModal(!showCameraInjectionModal);
  };
  const CameraInjectionModal = () => {
    return (
      <div className={styles.modalContainer}>
        <span className={styles.modalHeader}>
          {translation('sauceMenuCameraInjectionLabel')}
        </span>
        <span className={styles.modalDescription}>
          {translation('sauceMenuCameraInjectionDescription')}
        </span>

        <div className={styles.uploadWrapper}>
          <input
            accept="image/jpeg,image/png"
            className={styles.inputFile}
            type="file"
            ref={hiddenFileInput}
            onChange={handleFileUpload}
          />
          <button
            className={styles.uploadButton}
            type="button"
            onClick={handleUploadImageButton}
            disabled={imageProcessing}
          >
            {translation('sauceMenuCameraInjectionButton')}
          </button>
        </div>
      </div>
    );
  };
  const openCameraInjectionModal = () => {
    if (showBiometricsModal) {
      setShowBiometricsModal(false);
    }
    setShowCameraInjectionModal(!showCameraInjectionModal);
  };
  const handleBiometricsButton = () => {
    if (showCameraInjectionModal) {
      setShowCameraInjectionModal(false);
    }
    setShowBiometricsModal(!showBiometricsModal);
  };
  const handleBiometricsStatus = async (status) => {
    try {
      await applyAppiumMethod({
        methodName: 'executeScript',
        args: [`sauce:biometrics-authenticate=${status}`, []],
        skipRefresh: true,
      });
    } catch (ign) {}
    setShowBiometricsModal(!showBiometricsModal);
  };
  const BiometricsModal = () => {
    return (
      <div className={styles.modalContainer}>
        <span className={styles.modalHeader}>
          {translation('sauceMenuBiometricsLabel')}
        </span>
        <span className={styles.modalDescription}>
          {translation('sauceMenuBiometricsDescription')}
        </span>

        <div className={styles.biometricsButtonsWrapper}>
          <button
            className={styles.biometricsStatusButton}
            type="button"
            onClick={() => handleBiometricsStatus(true)}
            disabled={imageProcessing}
          >
            <CheckOutlined style={{ color: '#008000', fontSize: 22 }} />
            {translation('sauceMenuCameraInjectionButtonPass')}
          </button>
          <button
            className={styles.biometricsStatusButton}
            type="button"
            onClick={() => handleBiometricsStatus(false)}
            disabled={imageProcessing}
          >
            <CloseOutlined style={{ color: '#FF0000', fontSize: 22 }} />
            {translation('sauceMenuCameraInjectionButtonFail')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.menuContainer}>
        <div className={styles.header}>
          <Tooltip title={translation('sauceMenuDescription')}>
            <MenuOutlined />
          </Tooltip>
        </div>
        <div className={styles.content}>
          <div className={styles.row}>
            <Tooltip title={translation('sauceMenuHomeButton')}>
              <button className={styles.menuButton} onClick={pressHomeButton}>
                <HomeOutlined />
              </button>
            </Tooltip>
            {isAndroid && (
              <>
                <Tooltip title={translation('sauceMenuBackButton')}>
                  <button
                    className={styles.menuButton}
                    onClick={pressBackButton}
                  >
                    <ArrowLeftOutlined />
                  </button>
                </Tooltip>
                <Tooltip title={translation('sauceMenuRecentAppButton')}>
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
          <div className={styles.row}>
            <Tooltip title={translation('sauceMenuCameraInjectionLabel')}>
              <button
                className={styles.menuButton}
                onClick={openCameraInjectionModal}
              >
                <CameraOutlined />
              </button>
            </Tooltip>
            <Tooltip title={translation('sauceMenuBiometricsLabel')}>
              <button
                className={styles.menuButton}
                onClick={handleBiometricsButton}
              >
                <EyeOutlined />
              </button>
            </Tooltip>
            {showCameraInjectionModal && <CameraInjectionModal />}
            {showBiometricsModal && <BiometricsModal />}
          </div>
        </div>
        <div className={styles.footer} />
      </div>
    </>
  );
});

export default Menu;
