import {connect} from 'react-redux';

import * as SessionInspectorActions from '../actions/SessionInspector.js';
import SessionInspectorPage from '../components/SessionInspector/SessionInspector.jsx';

function mapStateToProps(state) {
  return state.inspector;
}

export default connect(mapStateToProps, SessionInspectorActions)(SessionInspectorPage);
