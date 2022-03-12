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
import { file } from 'electron-settings';

/**
 * The Sauce Real Device interaction Menu
 *
 * @param {object} menuData
 * @param {function} menuData.applyAppiumMethod
 * @param {string} menuData.platformName
 * @returns
 */
const Menu = memo(({ applyAppiumMethod, platformName }) => {
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
        <span className={styles.modalHeader}>Camera Injection</span>
        <span className={styles.modalDescription}>
          Choose an image to upload (png or jpg, maximum file size 5MB).
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
            Choose Image
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
        <span className={styles.modalHeader}>Biometric Authentication</span>
        <span className={styles.modalDescription}>
          Choose a response for fingerprint or face recognition.
        </span>

        <div className={styles.biometricsButtonsWrapper}>
          <button
            className={styles.biometricsStatusButton}
            type="button"
            onClick={() => handleBiometricsStatus(true)}
            disabled={imageProcessing}
          >
            <CheckOutlined style={{ color: '#008000', fontSize: 22 }} />
            Pass
          </button>
          <button
            className={styles.biometricsStatusButton}
            type="button"
            onClick={() => handleBiometricsStatus(false)}
            disabled={imageProcessing}
          >
            <CloseOutlined style={{ color: '#FF0000', fontSize: 22 }} />
            Fail
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
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
                  <button
                    className={styles.menuButton}
                    onClick={pressBackButton}
                  >
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
          <div className={styles.row}>
            <Tooltip title="Camera Injection">
              <button
                className={styles.menuButton}
                onClick={openCameraInjectionModal}
              >
                <CameraOutlined />
              </button>
            </Tooltip>
            <Tooltip title="Biometrics Authentication">
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
