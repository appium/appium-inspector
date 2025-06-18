import darkTheme from 'highlight.js/styles/atom-one-dark.css?url';
import lightTheme from 'highlight.js/styles/intellij-light.css?url';

export const loadHighlightTheme = (isDarkTheme) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';

  if (isDarkTheme) {
    link.href = darkTheme;
  } else {
    link.href = lightTheme;
  }

  document.head.appendChild(link);
};
