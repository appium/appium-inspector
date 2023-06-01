import configureStoreDev from './configureStore.development';
import configureStoreProd from './configureStore.production';

const selectedConfigureStore =
  process.env.NODE_ENV === 'production'
    ? configureStoreProd
    : configureStoreDev;

export const { configureStore } = selectedConfigureStore;

export const { history } = selectedConfigureStore;

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./configureStore.production');
} else {
  module.exports = require('./configureStore.development');
}
