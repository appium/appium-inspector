// Button.stories.js|jsx

import React, { Suspense } from 'react';

import Inspector from '../components/Inspector/Inspector';
import i18n from '../../configs/i18next.config.renderer';
import '../stylesheets/app.global.less';

export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  title: 'Inspector',
  component: Inspector,
};

const mockInspectorState = {
  screenshot: 'dummy', // Should switch this with base64 image
  t: (text) => text,
  i18n,
  applyClientMethod: () => {},
  sourceXML: `<app>
    <line-one>Line one</line-one>
  </app>`,
  getSavedActionFramework: () => {},
  runKeepAliveLoop: () => {},
};

export const FullScreen = () => 
  <Suspense fallback={<div>Loading...</div>}>
    <Inspector {...mockInspectorState} />
  </Suspense>;
