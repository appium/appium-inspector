import {App, ConfigProvider, Layout, theme} from 'antd';
import {createContext, useState} from 'react';

import {PREFERRED_THEME} from '../../shared/setting-defs.js';
import darkTheme from '../assets/stylesheets/prism-dark.css?url';
import lightTheme from '../assets/stylesheets/prism-light.css?url';
import Notification from '../components/Notification.jsx';
import {getSetting, setSetting, setTheme} from '../polyfills.js';

const systemPrefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = await getSetting(PREFERRED_THEME);
setTheme(savedTheme);

const loadHighlightTheme = (isDarkTheme) => {
  const linkId = 'highlight-theme';
  let link = document.getElementById(linkId);

  if (!link) {
    link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    document.head.appendChild(link);
  }

  if (isDarkTheme) {
    link.href = darkTheme;
  } else {
    link.href = lightTheme;
  }
};

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
    <ThemeContext value={{updateTheme, preferredTheme, isDarkTheme}}>
      <ConfigProvider theme={themeConfig}>
        <App>
          <Layout>{children}</Layout>
          <Notification />
        </App>
      </ConfigProvider>
    </ThemeContext>
  );
};
