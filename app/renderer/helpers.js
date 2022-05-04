const APPIUM_SESSION_FILE_VERSION = '1.0';

// get the slice of the redux state that's needed for the .appiumsession files
export function getSaveableState (reduxState) {
  return {
    version: APPIUM_SESSION_FILE_VERSION,
    caps: reduxState.caps,
    server: reduxState.server,
    serverType: reduxState.serverType,
    visibleProviders: reduxState.visibleProviders,
  };
}

export const APPIUM_SESSION_EXTENSION = 'appiumsession';
