import {combineReducers} from '@reduxjs/toolkit';

import builder from './SessionBuilder.js';
import inspector from './SessionInspector.js';

// create our root reducer
export default function createRootReducer() {
  return combineReducers({
    builder,
    inspector,
  });
}
