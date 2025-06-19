import {App, ConfigProvider, Layout, theme} from 'antd';
import {createContext, useEffect, useState} from 'react';

import {PREFERRED_THEME} from '../../shared/setting-defs';
import {getSetting, setSetting} from '../polyfills';
import {loadHighlightTheme} from '../utils/highlight-theme';

export const ThemeContext = createContext(null);

export const ThemeProvider = ({children}) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  loadHighlightTheme(isDarkTheme);

  useEffect(() => {
    initializeTheme();
  }, []);

  const initializeTheme = async () => {
    const savedTheme = await getSetting(PREFERRED_THEME);
    const prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkTheme(savedTheme ? savedTheme === 'dark' : prefersDarkTheme);
  };

  const toggleTheme = async () => {
    const newIsDarkTheme = !isDarkTheme;
    setIsDarkTheme(newIsDarkTheme);
    await setSetting(PREFERRED_THEME, newIsDarkTheme ? 'dark' : 'light');
  };

  const themeConfig = {
    algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      fontSize: 12,
    },
    components: {
      Tabs: {
        titleFontSize: 14,
      },
    },
  };

  return (
    <ThemeContext.Provider value={{toggleTheme, isDarkTheme}}>
      <ConfigProvider theme={themeConfig}>
        <App>
          <Layout data-theme={isDarkTheme ? 'dark' : 'light'}>{children}</Layout>
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
