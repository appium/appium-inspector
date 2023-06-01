import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import { routerMiddleware, push } from 'connected-react-router';
import actions from './actions';
import createRootReducer from './reducers';

const history = createHashHistory();

const rootReducer = createRootReducer(history);

const configureStore = (initialState) => {
  const middleware = [];
  let composeEnhancers = compose;

  // Thunk Middleware
  middleware.push(thunk);

  // Additional development tools
  if (process.env.NODE_ENV === 'development') {
    // Logging Middleware
    const { createLogger } = require('redux-logger');
    const logger = createLogger({
      level: 'info',
      collapsed: true
    });
    middleware.push(logger);

    // Use Redux DevTools Extension if installed
    if (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
      composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        // Options: https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
        actionCreators: {...actions, push}
      });
    }
  }

  // Router Middleware
  const router = routerMiddleware(history);
  middleware.push(router);

  // Apply Middleware & Compose Enhancers
  const enhancer = composeEnhancers(
    applyMiddleware(...middleware)
  );

  // Create Store
  const store = createStore(rootReducer, initialState, enhancer);

  if (module.hot) {
    module.hot.accept(
      '../reducers',
      () => store.replaceReducer(require('./reducers').default)
    );
  }

  return store;
};

export default { configureStore, history };
