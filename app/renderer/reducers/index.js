import { combineReducers } from '@reduxjs/toolkit';
import session from './Session';
import inspector from './Inspector';
import updater from './Updater';

// create our root reducer
export default function createRootReducer () {
  return combineReducers({
    session,
    inspector,
    updater,
  });
}
