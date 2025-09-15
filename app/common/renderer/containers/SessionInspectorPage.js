import {connect} from 'react-redux';

import * as SessionInspectorActions from '../actions/SessionInspector.js';
import SessionInspectorPage from '../components/SessionInspector/SessionInspector.jsx';
import {withTranslation} from '../i18next.js';

function mapStateToProps(state) {
  return state.inspector;
}

export default withTranslation(
  SessionInspectorPage,
  connect(mapStateToProps, SessionInspectorActions),
);
