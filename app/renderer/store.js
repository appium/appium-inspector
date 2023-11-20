import {configureStore} from '@reduxjs/toolkit';

import actions from './actions';
import createRootReducer from './reducers';

const store = configureStore({
  reducer: createRootReducer(),
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware({
      serializableCheck: false,
    });

    // Additional development tools
    if (process.env.NODE_ENV === 'development') {
      // Logging Middleware
      const {createLogger} = require('redux-logger');
      const logger = createLogger({
        level: 'info',
        collapsed: true,
      });
      middleware.push(logger);
    }

    return middleware;
  },
  devTools:
    process.env.NODE_ENV !== 'development'
      ? false
      : {
          actionCreators: {...actions},
        },
});

export default store;
