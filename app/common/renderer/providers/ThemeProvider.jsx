import {App, ConfigProvider, Layout, theme} from 'antd';
import {createContext, useState} from 'react';

import {PREFERRED_THEME} from '../../shared/setting-defs.js';
import Notification from '../components/Notification.jsx';
import {getSetting, setSetting, setTheme} from '../polyfills.js';
import {loadHighlightTheme} from '../utils/highlight-theme.js';

const systemPrefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = await getSetting(PREFERRED_THEME);
setTheme(savedTheme);

export const ThemeContext = createContext(null);

export const ThemeProvider = ({children}) => {
  const [preferredTheme, setPreferredTheme] = useState(savedTheme);

  const isDarkTheme =
    preferredTheme === 'dark' || (preferredTheme === 'system' && systemPrefersDarkTheme);

  loadHighlightTheme(isDarkTheme);

  const handleDarkClass = () => {
    if (isDarkTheme) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  };

  handleDarkClass();

  const updateTheme = async (theme) => {
    setTheme(theme);
    setPreferredTheme(theme);
    await setSetting(PREFERRED_THEME, theme);
  };

  const themeConfig = {
    algorithm: isDarkTheme ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorBgLayout: isDarkTheme ? '#191919' : '#f5f5f5',
      fontSize: 12,
    },
    components: {
      Badge: {
        colorError: '#1677ff',
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
    <ThemeContext.Provider value={{updateTheme, preferredTheme, isDarkTheme}}>
      <ConfigProvider theme={themeConfig}>
        <App>
          <Layout>{children}</Layout>
          <Notification />
        </App>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
