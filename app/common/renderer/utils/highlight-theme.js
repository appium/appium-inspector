import darkTheme from 'highlight.js/styles/atom-one-dark.css?url';
import lightTheme from 'highlight.js/styles/intellij-light.css?url';

export const loadHighlightTheme = (isDarkTheme) => {
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
