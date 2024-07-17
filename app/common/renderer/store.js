import {configureStore} from '@reduxjs/toolkit';
import {createLogger} from 'redux-logger';

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
