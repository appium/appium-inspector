import { configureStore } from '@reduxjs/toolkit';
import { createHashHistory } from 'history';
import { createReduxHistoryContext, push } from 'redux-first-history';
import actions from './actions';
import createRootReducer from './reducers';

const { createReduxHistory, routerMiddleware, routerReducer } = createReduxHistoryContext({
  history: createHashHistory()
});

const rootReducer = createRootReducer(routerReducer);

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => {
    const middleware = getDefaultMiddleware({
      serializableCheck: false
    });

    // Additional development tools
    if (process.env.NODE_ENV === 'development') {
      // Logging Middleware
      const { createLogger } = require('redux-logger');
      const logger = createLogger({
        level: 'info',
        collapsed: true
      });
      middleware.push(logger);
    }

    // Router Middleware
    middleware.push(routerMiddleware);

    return middleware;
  },
  devTools: {
    actionCreators: {...actions, push}
  }
});

export const history = createReduxHistory(store);
