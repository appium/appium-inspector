import * as inspectorActions from './Inspector';
import * as sessionActions from './Session';
import * as updaterActions from '../../../gui-common/actions/Updater';

export default {
  ...inspectorActions,
  ...sessionActions,
  ...updaterActions,
};
