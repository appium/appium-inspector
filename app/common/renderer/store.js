import {configureStore} from '@reduxjs/toolkit';

import actions from './actions/index.js';
import createRootReducer from './reducers/index.js';

const store = configureStore({
  reducer: createRootReducer(),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools:
    process.env.NODE_ENV !== 'development'
      ? false
      : {
          actionCreators: {...actions},
        },
});

export default store;
