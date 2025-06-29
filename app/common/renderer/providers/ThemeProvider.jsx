import {App, ConfigProvider, Layout, theme} from 'antd';
import {createContext, useEffect, useState} from 'react';

import {PREFERRED_THEME} from '../../shared/setting-defs';
import Notification from '../components/Notification';
import {getSetting, setSetting} from '../polyfills';
import {loadHighlightTheme} from '../utils/highlight-theme';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({children}) => {
  const [preferredTheme, setPreferredTheme] = useState('system');

  const systemPrefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDarkTheme =
    preferredTheme === 'dark' || (preferredTheme === 'system' && systemPrefersDarkTheme);

  loadHighlightTheme(isDarkTheme);

  useEffect(() => {
    initTheme();
  }, []);

  const handleDarkClass = () => {
    if (isDarkTheme) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  handleDarkClass();

  const initTheme = async () => {
    const savedTheme = await getSetting(PREFERRED_THEME);
    setPreferredTheme(savedTheme);
  };

  const updatePreferredTheme = async (theme) => {
    setPreferredTheme(theme);
    await setSetting(PREFERRED_THEME, theme);
  };

  const themeConfig = {
    algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      fontSize: 12,
    },
    components: {
      Badge: {
        indicatorHeight: 20,
        textFontSize: 12,
      },
      Switch: {
        handleSize: 18,
        trackHeight: 22,
        trackMinWidth: 44,
      },
      Tabs: {
        titleFontSize: 14,
      },
    },
  };

  return (
    <ThemeContext.Provider value={{updatePreferredTheme, preferredTheme, isDarkTheme}}>
      <ConfigProvider theme={themeConfig}>
        <App>
          <Layout>{children}</Layout>
          <Notification />
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
