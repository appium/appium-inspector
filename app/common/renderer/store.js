import {configureStore} from '@reduxjs/toolkit';

import actions from './actions';
import createRootReducer from './reducers';

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
